"""
Zions DevKick — FastAPI Backend
RAG-powered chatbot with ChromaDB vector store, PR reviewer, and Confluence connector.
"""
print("=== LOADING MAIN.PY — CLOUD FUNCTIONS V2 VERSION ===")

import os
import glob
import hashlib
import json
import re
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# LangChain imports
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_classic.chains import RetrievalQA
from langchain_core.prompts import PromptTemplate
from langchain_core.documents import Document

load_dotenv()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(title="Zions DevKick API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GOOGLE_BASE_URL = os.getenv("GOOGLE_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-004")

KNOWLEDGE_BASE_DIR = Path(__file__).parent / "knowledge_base"
CHROMA_PERSIST_DIR = Path(__file__).parent / "chroma_db"

# ---------------------------------------------------------------------------
# Confluence Connector (mock + real-ready)
# ---------------------------------------------------------------------------
CONFLUENCE_BASE_URL = os.getenv("CONFLUENCE_BASE_URL", "")
CONFLUENCE_USERNAME = os.getenv("CONFLUENCE_USERNAME", "")
CONFLUENCE_API_TOKEN = os.getenv("CONFLUENCE_API_TOKEN", "")
CONFLUENCE_SPACE_KEY = os.getenv("CONFLUENCE_SPACE_KEY", "CP")


class ConfluenceConnector:
    """
    Connector that can pull pages from Confluence REST API.
    Falls back to local knowledge_base files if credentials are not configured.
    """

    def __init__(self):
        self.is_configured = bool(
            CONFLUENCE_BASE_URL and CONFLUENCE_USERNAME and CONFLUENCE_API_TOKEN
        )

    def fetch_pages_from_confluence(self, space_key: str = "CP", limit: int = 10) -> list[Document]:
        """Fetch pages from live Confluence API."""
        if not self.is_configured:
            return []

        import httpx
        from html.parser import HTMLParser

        class HTMLStripper(HTMLParser):
            def __init__(self):
                super().__init__()
                self.text_parts: list[str] = []
            def handle_data(self, data: str):
                self.text_parts.append(data)
            def get_text(self) -> str:
                return " ".join(self.text_parts)

        documents = []
        try:
            url = f"{CONFLUENCE_BASE_URL}/rest/api/content"
            params = {
                "spaceKey": space_key,
                "limit": limit,
                "expand": "body.storage,metadata.labels",
            }
            auth = (CONFLUENCE_USERNAME, CONFLUENCE_API_TOKEN)

            with httpx.Client(timeout=30) as client:
                resp = client.get(url, params=params, auth=auth)
                resp.raise_for_status()
                data = resp.json()

            for page in data.get("results", []):
                html_body = page.get("body", {}).get("storage", {}).get("value", "")
                stripper = HTMLStripper()
                stripper.feed(html_body)
                text = stripper.get_text()

                if text.strip():
                    documents.append(
                        Document(
                            page_content=text,
                            metadata={
                                "source": f"confluence:{page['id']}",
                                "title": page.get("title", ""),
                                "url": f"{CONFLUENCE_BASE_URL}/wiki/spaces/{space_key}/pages/{page['id']}",
                                "type": "confluence",
                            },
                        )
                    )
            print(f"[Confluence] Fetched {len(documents)} pages from space '{space_key}'")
        except Exception as e:
            print(f"[Confluence] Error fetching pages: {e}")

        return documents

    def load_local_knowledge_base(self) -> list[Document]:
        """Load documents from the local knowledge_base directory."""
        documents = []
        md_files = glob.glob(str(KNOWLEDGE_BASE_DIR / "*.md"))

        for filepath in md_files:
            with open(filepath, "r") as f:
                content = f.read()

            filename = Path(filepath).stem
            title = filename.replace("_", " ").title()

            documents.append(
                Document(
                    page_content=content,
                    metadata={
                        "source": f"local:{filename}",
                        "title": title,
                        "file": filepath,
                        "type": "local_kb",
                    },
                )
            )

        print(f"[KnowledgeBase] Loaded {len(documents)} local documents")
        return documents

    def get_all_documents(self) -> list[Document]:
        """Get documents from all sources."""
        docs = self.load_local_knowledge_base()

        # Try Confluence if configured
        confluence_docs = self.fetch_pages_from_confluence(CONFLUENCE_SPACE_KEY)
        docs.extend(confluence_docs)

        return docs


# ---------------------------------------------------------------------------
# RAG Pipeline
# ---------------------------------------------------------------------------
confluence_connector = ConfluenceConnector()
vectorstore: Optional[Chroma] = None
qa_chain = None


def get_content_hash(documents: list[Document]) -> str:
    content = "".join(sorted(d.page_content for d in documents))
    return hashlib.md5(content.encode()).hexdigest()


def initialize_rag():
    """Initialize the RAG pipeline with ChromaDB vector store."""
    global vectorstore, qa_chain

    if not GOOGLE_API_KEY:
        print("[RAG] WARNING: No GOOGLE_API_KEY set. Using mock responses.")
        return

    # Load documents
    documents = confluence_connector.get_all_documents()
    if not documents:
        print("[RAG] No documents found!")
        return

    # Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n## ", "\n### ", "\n\n", "\n", " "],
    )
    chunks = text_splitter.split_documents(documents)
    print(f"[RAG] Split into {len(chunks)} chunks")

    # Create embeddings and vector store
    embedding_kwargs = {"api_key": GOOGLE_API_KEY}
    if GOOGLE_BASE_URL:
        embedding_kwargs["base_url"] = GOOGLE_BASE_URL

    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL, **embedding_kwargs)

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(CHROMA_PERSIST_DIR),
        collection_name="zions_devkick",
    )
    print(f"[RAG] ChromaDB vector store created with {len(chunks)} vectors")

    # Create LLM
    llm_kwargs = {"api_key": GOOGLE_API_KEY, "model": MODEL_NAME, "temperature": 0.3}
    if GOOGLE_BASE_URL:
        llm_kwargs["base_url"] = GOOGLE_BASE_URL

    llm = ChatOpenAI(**llm_kwargs)

    # Create retrieval chain
    prompt_template = PromptTemplate(
        input_variables=["context", "question"],
        template="""You are DevKick, the Zions Bancorporation internal developer assistant.
You help developers troubleshoot errors, understand internal processes, and navigate Zions' cloud infrastructure.

Use the following context from Zions' internal documentation to answer the question.
If the context doesn't contain enough information, say so honestly but still try to be helpful.

Always be specific: mention exact role names, project IDs, service account names, and links when available.
Format your response with clear headings, bullet points, and code blocks where appropriate.

Context from Zions documentation:
{context}

Developer's question: {question}

Helpful answer:""",
    )

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever(search_kwargs={"k": 4}),
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt_template},
    )
    print("[RAG] QA chain initialized successfully")


# ---------------------------------------------------------------------------
# Mock response fallback (when no API key is available)
# ---------------------------------------------------------------------------
MOCK_RESPONSES = {
    "403": """## GCP IAM 403 Forbidden — Troubleshooting

Based on Zions' internal documentation, this error means your account lacks the required IAM permission.

### For `iam.serviceAccounts.actAs` errors:
You need the **`roles/iam.serviceAccountUser`** role on the target service account.

### Steps to resolve:
1. **Open a ServiceNow ticket** — select "Request GCP Access"
2. **Specify:** Project ID: `zions-prod-01`, Role: `roles/iam.serviceAccountUser`
3. **Target SA:** `sa-iac-creator-01@zions-prod-01.iam.gserviceaccount.com`
4. **SLA:** 1-2 business days (expedited for incidents: 2-4 hours)

### Quick fix (if you have project owner access):
```bash
gcloud iam service-accounts add-iam-policy-binding \\
  sa-iac-creator-01@zions-prod-01.iam.gserviceaccount.com \\
  --member="user:your.email@zionsbancorp.com" \\
  --role="roles/iam.serviceAccountUser" \\
  --project=zions-prod-01
```

> **Note:** According to Zions GCP IAM policy, you need to request the `sa-iac-creator-01` role via ServiceNow.""",

    "pipeline": """## ADO Pipeline Failure — Troubleshooting

Based on Zions' ADO template documentation:

### Error: "TerraformTaskV4 input command not valid"
This usually means you're using the **raw Terraform task** instead of the **approved Zions template**.

### Fix:
Replace your pipeline YAML with the approved template reference:

```yaml
resources:
  repositories:
    - repository: templates
      type: git
      name: CloudPlatform/zions-ado-templates
      ref: refs/heads/main

stages:
  - template: terraform-plan-apply.yml@templates
    parameters:
      environment: 'dev'
      terraformVersion: '1.9.0'
      workingDirectory: '$(System.DefaultWorkingDirectory)/infra'
      serviceConnection: 'zions-gcp-dev'
```

### Template Repo:
`https://dev.azure.com/ZionsBancorp/CloudPlatform/_git/zions-ado-templates`""",

    "access": """## Requesting GCP IAM Access at Zions

### Process:
1. Go to **ServiceNow** → Service Catalog → "Request GCP Access"
2. Fill in:
   - **Project ID:** e.g., `zions-dev-analytics`
   - **Role needed:** e.g., `roles/editor`
   - **Business justification:** Why you need this access
3. **Approval chain:** Your Manager → Cloud Platform Team
4. **SLA:** 1-2 business days

### Tips:
- Request the **minimum role** needed (prefer `roles/viewer` over `roles/editor`)
- For **emergency access** (production incident), contact Cloud Platform on-call via PagerDuty
- Emergency access is granted within 30 minutes but is temporary (72 hours)

Or simply use the **Tickets tab** in DevKick to submit your request directly!""",

    "goalie": """## Goalie Escalation Process

### What is the Goalie?
The Goalie is a rotating role on the Cloud Platform team responsible for reviewing/approving incoming PRs, triaging pipeline failures, and handling developer escalations.

### How to Escalate to the Goalie:

#### Option 1: From DevKick Chat (Recommended)
1. Describe your issue in this chat
2. **Hover over any message** and click **"Escalate to Goalie"**
3. A ServiceNow ticket is auto-created with your conversation context
4. The ticket is tagged for **Goalie Review Queue** with priority SLA

#### Option 2: From DevKick Tickets Tab
1. Go to the **Tickets tab**
2. Select **"Goalie"** as the ticket type
3. Fill in details and submit
4. View the **Goalie Queue** to track your escalation

### Escalation Priority SLAs:
| Priority | SLA | Examples |
|---|---|---|
| **Critical** | 30 minutes | Production pipeline blocked, state lock affecting multiple teams |
| **High** | 2 hours | PR blocked on IAM issue, missing group/entitlement |
| **Medium** | 4 hours | Pipeline rerun needed, cost center validation |
| **Low** | 1 business day | Documentation question, process clarification |

### Common Goalie Issues:
- **State locks** blocking pipelines → Goalie can force-unlock
- **IAM group not created** but entitlements added → Goalie investigates
- **Cost center validation** missing on PRs → Goalie flags
- **Pipeline reruns** needed due to IAM timing → Goalie can rerun

> **Tip:** You can also escalate directly from the Chat tab by hovering over any message and clicking "Escalate to Goalie".""",

    "state_lock": """## Terraform State Lock Issue

### What's happening:
Terraform state locks prevent concurrent modifications to the same state file. When a pipeline fails mid-run or is cancelled, the lock may not be released.

### Symptoms:
```
Error: Error acquiring the state lock
Lock Info:
  ID:        xxxx-xxxx-xxxx
  Path:      zions-tfstate-prod-01/terraform/state
  Operation: OperationTypeApply
```

### Resolution:
1. **Escalate to Goalie** — the Goalie can force-unlock the state
2. If you have access, run:
```bash
terraform force-unlock <LOCK_ID>
```
3. **Caution:** Only force-unlock if you're certain no other operation is running

### Known Issue at Zions:
State lock issues have been affecting multiple pipelines. The Goalie team is investigating a permanent fix. In the meantime:
- Always let pipeline runs complete — don't cancel mid-apply
- If you see a lock, check with your team before force-unlocking
- Escalate via the **"Escalate to Goalie"** button in the Chat tab

> **Action:** Hover over this message and click **"Escalate to Goalie"** to create a ticket for the state lock issue.""",

    "security": """## Zions GCP Security Standards

Based on the Zions Cloud Security Standards documentation:

### Key Security Requirements for Code Reviews:

#### Authentication & Authorization
- **No hardcoded credentials** — use GCP Secret Manager or Azure Key Vault
- **Least privilege IAM** — never use `roles/owner` or `roles/editor`; use narrow predefined roles
- **No service account keys** — use Workload Identity Federation for GKE, attached SAs for Compute/Cloud Run

#### Network Security
- **No public IPs** on compute instances, GKE nodes, or Cloud SQL — use Cloud NAT
- **No `0.0.0.0/0` firewall rules** — restrict to Zions-approved CIDR blocks
- **VPC Flow Logs** enabled on all subnets

#### Data Protection
- **CMEK encryption** required for all storage (GCS, BigQuery, Cloud SQL, disks)
- **mTLS** or service mesh for internal service-to-service communication
- **DLP scanning** for BigQuery datasets with customer data

#### Container Security
- Only use approved base images from `us-central1-docker.pkg.dev/zions-shared-01/approved-bases/`
- No root containers — use `USER nonroot` in Dockerfiles
- CPU and memory limits required on all Kubernetes pods

### Checkov Policies (Must Pass):
| Policy | Description |
|---|---|
| CKV_GCP_24 | Encryption at rest for storage |
| CKV_GCP_38 | No public IPs on compute |
| CKV_GCP_15 | Audit logging enabled |
| CKV_GCP_2 | No overly permissive firewalls |
| CKV_GCP_11 | VPC Flow Logs enabled |

> Use the **Review tab** to automatically check your PR against these standards.""",

    "pr_standards": """## PR Standards at Zions

Based on Zions' development guidelines:

### PR Title Format:
```
[ADO-WorkItemID] Short description of the change
```
Example: `[12345] Add IAM role binding for analytics service account`

### PR Requirements:
1. **Link to ADO Work Item** — every PR must be linked to a User Story, Task, or Bug
2. **At least 1 reviewer** from your team
3. **All automated checks must pass:**
   - Checkov security scan (zero CRITICAL/HIGH findings)
   - tflint with Zions ruleset
   - Unit tests with >80% code coverage
4. **PR description must include:**
   - **What:** What changed and which files
   - **Why:** Business justification or ticket reference
   - **Testing:** How you tested the change
   - **Rollback plan:** How to revert if something goes wrong
5. **Max PR size:** 400 lines changed — split larger PRs into smaller ones

### For Terraform PRs specifically:
- Include `terraform plan` output in the PR description
- Verify no secrets in code (use `sensitive = true` for variables)
- Use shared modules from `terraform-gcp-modules` repo
- Follow naming convention: `zions-{env}-{service}-{resource}`

### Approval Flow:
- **Dev environment:** 1 team member approval
- **Staging:** 1 tech lead approval
- **Production:** 2 approvals (tech lead + Cloud Platform team member)

> **Tip:** Use the **Review tab** in DevKick for an automated first-pass before requesting human review.""",

    "terraform": """## Terraform Best Practices at Zions

### Project Structure:
```
infra/
├── main.tf           # Primary resource definitions
├── variables.tf      # Input variable declarations
├── outputs.tf        # Output value declarations
├── providers.tf      # Provider configuration
├── backend.tf        # GCS state backend
├── versions.tf       # Version constraints
└── modules/          # Local modules (prefer shared modules)
```

### State Management:
- **Backend:** GCS with state locking
- **Bucket naming:** `zions-tfstate-{environment}-{project-shortname}`
- **CMEK encryption** required on state buckets
```hcl
terraform {
  backend "gcs" {
    bucket = "zions-tfstate-dev-myproject"
    prefix = "terraform/state"
  }
}
```

### Key Rules:
- Use **shared modules** from `terraform-gcp-modules` repo
- **Pin provider versions** to exact versions
- **No hardcoded secrets** — use `sensitive = true`
- Follow naming: `zions-{env}-{service}-{resource}`
- **All resources** must have `environment`, `team`, and `cost_center` labels
- Use approved pipeline template: `terraform-plan-apply.yml@templates`

### Common Errors & Fixes:
| Error | Cause | Fix |
|---|---|---|
| State lock | Pipeline cancelled mid-run | Escalate to Goalie for force-unlock |
| 403 Permission denied | Missing IAM role | Request via ServiceNow Tickets tab |
| Checkov failed | Security violation | Fix the specific CKV policy |
| Provider version mismatch | Unpinned version | Pin in `versions.tf` |

> Use the **Chat tab** to ask about specific Terraform errors.""",

    "use_case": """## Use Case Pipeline Template at Zions

### Getting Started with a New Use Case:

#### 1. Clone the Template
The standard use case template is available at:
`https://dev.azure.com/ZionsBancorp/CloudPlatform/_git/zions-use-case-template`

#### 2. Required Folder Structure:
```
my-use-case/
├── infra/              # Terraform for GCP infrastructure
│   ├── main.tf
│   ├── variables.tf
│   └── backend.tf
├── src/                # Application source code
├── tests/              # Unit and integration tests
├── docs/               # Documentation and ADRs
├── azure-pipelines.yml # ADO pipeline definition
└── README.md           # Project documentation
```

#### 3. Pipeline Setup:
Your `azure-pipelines.yml` must reference the approved templates:
```yaml
resources:
  repositories:
    - repository: templates
      type: git
      name: CloudPlatform/zions-ado-templates
      ref: refs/heads/main

stages:
  - template: terraform-plan-apply.yml@templates
    parameters:
      environment: 'dev'
      terraformVersion: '1.9.0'
      workingDirectory: '$(System.DefaultWorkingDirectory)/infra'
      serviceConnection: 'zions-gcp-dev'
```

#### 4. GCP Project Provisioning:
- Submit a ServiceNow request for a new GCP project
- Include: use case name, cost center, team, environment
- The Cloud Platform team provisions the project with standard guardrails

#### 5. Required Labels on All GCP Resources:
```hcl
labels = {
  environment  = "dev"
  team         = "analytics"
  cost_center  = "CC-12345"
  use_case     = "my-use-case"
  managed_by   = "terraform"
}
```

> Use the **Actions tab** → "Repo Bootstrap" to create a new repo from the template instantly.""",

    "servicenow": """## ServiceNow at Zions — Quick Reference

### How to Submit a Request:

#### From DevKick (Fastest):
1. Click the **Tickets tab**
2. Select request type (Incident, GCP Access, Goalie Escalation, Bug, etc.)
3. Fill in title, description, priority
4. Click Submit — get your RITM number instantly

#### Request Types:
| Type | When to Use | SLA |
|---|---|---|
| **Incident** | Something is broken in production | P1: 1hr, P2: 4hr |
| **GCP Access** | Need IAM role or permission | 1-2 business days |
| **Goalie Escalation** | Pipeline blocked, needs Goalie review | Critical: 30min |
| **Bug** | Software defect found | 1-3 business days |
| **Change Request** | Planned infra change | Requires CAB approval |

#### For GCP IAM Access Requests:
Always specify:
- **Project ID** (e.g., `zions-dev-analytics`)
- **Exact role** (e.g., `roles/iam.serviceAccountUser`)
- **Business justification**
- **Duration** (permanent or temporary)

> **Tip:** You can also escalate directly from the Chat tab by hovering over any AI response and clicking "Escalate to Goalie" or "Create Ticket".""",
}


def get_mock_response(message: str) -> tuple[str, list[str]]:
    """Generate a smart mock response using keyword scoring."""
    msg_lower = message.lower()

    # Score each topic by counting keyword matches
    topic_scores: list[tuple[str, int, list[str]]] = [
        ("403", _score(msg_lower, ["403", "forbidden", "permission denied", "denied", "permission"]),
         ["GCP IAM 403 Troubleshooting", "ServiceNow Request Process"]),

        ("goalie", _score(msg_lower, ["goalie", "escalat", "on-call", "oncall", "review queue"]),
         ["Goalie Issues And Process", "ServiceNow Request Process"]),

        ("state_lock", _score(msg_lower, ["state lock", "force-unlock", "lock", "locked", "acquiring the state"]),
         ["Goalie Issues And Process", "Terraform Best Practices"]),

        ("pipeline", _score(msg_lower, ["pipeline", "ado pipeline", "azure devops", "cicd", "ci/cd", "build failed", "deploy failed", "yaml", "TerraformTaskV4"]),
         ["ADO Template Guidelines"]),

        ("access", _score(msg_lower, ["access", "iam role", "request access", "gcp access", "role binding", "service account"]),
         ["ServiceNow Request Process", "GCP IAM 403 Troubleshooting"]),

        ("security", _score(msg_lower, ["security", "checkov", "compliance", "encryption", "cmek", "public ip", "firewall", "vuln", "cve", "container", "ckv_gcp"]),
         ["Zions Security Standards", "Terraform Best Practices"]),

        ("pr_standards", _score(msg_lower, ["pr standard", "pull request", "code review", "pr title", "pr description", "reviewer", "approval", "pr size", "definition of done", "dod"]),
         ["Zions Security Standards", "ADO Template Guidelines"]),

        ("terraform", _score(msg_lower, ["terraform", "hcl", "tf module", "tfstate", "provider", "terraform plan", "terraform apply", "modules", "backend.tf"]),
         ["Terraform Best Practices", "ADO Template Guidelines"]),

        ("use_case", _score(msg_lower, ["use case", "template", "bootstrap", "new project", "new repo", "scaffold", "onboard", "folder structure", "microservice"]),
         ["ADO Template Guidelines"]),

        ("servicenow", _score(msg_lower, ["servicenow", "snow", "ticket", "ritm", "incident", "change request", "submit ticket", "create ticket"]),
         ["ServiceNow Request Process"]),
    ]

    # Pick the highest scoring topic
    best = max(topic_scores, key=lambda x: x[1])

    if best[1] > 0:
        return MOCK_RESPONSES[best[0]], best[2]

    # Fallback — still try to be helpful
    return (
        f"Great question! Let me search through Zions' internal documentation...\n\n"
        f"Based on your query about *\"{message[:80]}\"*, here's what I'd suggest:\n\n"
        "### Quick Actions:\n"
        "- **GCP Issues?** Ask me about specific error messages (e.g., '403 forbidden')\n"
        "- **Pipeline Problems?** Describe the ADO pipeline error you're seeing\n"
        "- **Need Access?** Ask me 'how to request IAM access'\n"
        "- **PR Help?** Ask about 'PR standards' or 'code review checklist'\n"
        "- **Terraform?** Ask about 'terraform best practices' or 'state lock'\n"
        "- **Escalate?** Ask 'how to escalate to goalie'\n\n"
        "Try rephrasing your question with one of these topics, or use the **quick prompts** above!\n\n"
        "> **Tip:** You can also browse **Developer Standards** in the Actions tab.",
        ["Zions Knowledge Base"],
    )


def _score(text: str, keywords: list[str]) -> int:
    """Score how well text matches a list of keywords."""
    score = 0
    for kw in keywords:
        if kw in text:
            score += len(kw)  # Longer matches = higher score
    return score


# ---------------------------------------------------------------------------
# Request/Response Models
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class ChatResponse(BaseModel):
    response: str
    sources: list[str] = []


class ReviewRequest(BaseModel):
    url: str
    code_snippet: Optional[str] = None


class ReviewResponse(BaseModel):
    raw_review: str
    structured: dict


class ConfluenceSyncRequest(BaseModel):
    space_key: str = "CP"
    limit: int = 10


class DocumentUploadRequest(BaseModel):
    """Upload a document to the knowledge base for RAG."""
    title: str
    content: str  # Plain text content (up to 50000 chars)
    url: Optional[str] = None  # Optional source URL
    doc_type: str = "uploaded"  # 'uploaded', 'confluence', 'url'


# ---------------------------------------------------------------------------
# Hardcoded PR snippet for demo (The "Mock" part)
# ---------------------------------------------------------------------------
DEMO_TERRAFORM_SNIPPET = '''
# main.tf — PR #165549: GCP Cloud Functions v2 module update
resource "google_cloudfunctions2_function" "etl_processor" {
  name        = "etl-data-processor"
  location    = "us-central1"
  project     = "zions-prod-data-01"
  description = "ETL pipeline processor for analytics ingestion"

  build_config {
    runtime     = "python311"
    entry_point = "process_event"

    source {
      storage_source {
        bucket = "zions-cf-source-prod"
        object = "etl-processor-v2.zip"
      }
    }
  }

  service_config {
    max_instance_count    = 100
    min_instance_count    = 0
    available_memory      = "512Mi"
    timeout_seconds       = 540
    ingress_settings      = "ALLOW_ALL"  # Allows public internet traffic!
    all_traffic_on_latest_revision = true

    environment_variables = {
      DB_HOST     = "10.0.1.5"
      DB_NAME     = "analytics_prod"
      DB_PASSWORD = "Pr0d@nalyt1cs2026!"  # Hardcoded secret!
      API_KEY     = "AIzaSyB3x8K7mN2pQ4rT5vW6xY9zA1bC3dE5fG"  # Hardcoded API key!
    }

    service_account_email = "sa-iac-creator-01@zions-prod-data-01.iam.gserviceaccount.com"
  }

  # Missing: VPC connector for private networking
  # Missing: CMEK encryption configuration
}

resource "google_cloudfunctions2_function_iam_member" "public_invoker" {
  project        = "zions-prod-data-01"
  location       = "us-central1"
  cloud_function = google_cloudfunctions2_function.etl_processor.name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"  # Anyone on the internet can invoke this function!
}

resource "google_storage_bucket" "function_source" {
  name     = "zions-cf-source-prod"
  location = "US"
  project  = "zions-prod-data-01"

  # Missing: CMEK encryption
  # Missing: versioning
  # Missing: access logging
  # Missing: uniform bucket-level access
}

resource "google_project_iam_member" "function_sa_role" {
  project = "zions-prod-data-01"
  role    = "roles/editor"  # Overly broad — violates least privilege
  member  = "serviceAccount:sa-iac-creator-01@zions-prod-data-01.iam.gserviceaccount.com"
}

variable "db_connection_string" {
  default = "postgresql://admin:Pr0d@nalyt1cs2026!@10.0.1.5:5432/analytics_prod"  # Hardcoded credentials!
}
'''


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    """Initialize RAG pipeline on startup."""
    print("=" * 60)
    print("  Zions DevKick Backend Starting...")
    print("=" * 60)
    initialize_rag()
    if confluence_connector.is_configured:
        print("[Confluence] Live connector is configured")
    else:
        print("[Confluence] Using local knowledge base (set CONFLUENCE_* env vars for live)")
    print("=" * 60)


@app.get("/")
async def root():
    return {
        "name": "Zions DevKick API",
        "version": "1.0.0",
        "status": "running",
        "rag_enabled": qa_chain is not None,
        "confluence_live": confluence_connector.is_configured,
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """RAG-powered chat endpoint."""
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    # Use RAG chain if available
    if qa_chain:
        try:
            result = qa_chain.invoke({"query": message})
            response_text = result["result"]
            sources = list(
                {doc.metadata.get("title", "Unknown") for doc in result.get("source_documents", [])}
            )
            return ChatResponse(response=response_text, sources=sources)
        except Exception as e:
            print(f"[Chat] RAG error: {e}")
            # Fall back to mock
            response, sources = get_mock_response(message)
            return ChatResponse(response=response, sources=sources)
    else:
        # No API key — use mock responses
        response, sources = get_mock_response(message)
        return ChatResponse(response=response, sources=sources)


@app.post("/api/review", response_model=ReviewResponse)
async def review_pr(request: ReviewRequest):
    """PR code review endpoint. Uses hardcoded snippet + real LLM analysis."""
    import time
    code = request.code_snippet or DEMO_TERRAFORM_SNIPPET
    cache_bust = str(int(time.time()))

    review_prompt = f"""[Request ID: {cache_bust}] You are a senior cloud security engineer at Zions Bancorporation reviewing a Terraform pull request for a GCP Cloud Functions v2 module (PR #165549 in tfmod_gcp_cloud_functionsv2 repo).

Analyze this EXACT code against Zions' security standards. Only reference resources that actually appear in the code below. This code is about Cloud Functions v2 (google_cloudfunctions2_function), NOT compute instances:

1. **No public invocation** of Cloud Functions (no allUsers IAM bindings)
2. **No hardcoded secrets** in environment variables or Terraform variables
3. **Encryption at rest** for all storage (CMEK required)
4. **Least privilege** IAM roles (no roles/editor or roles/owner)
5. **Ingress restrictions** on Cloud Functions (no ALLOW_ALL)
6. **VPC connector** required for private networking
7. **Proper naming conventions** (zions-{{env}}-{{service}}-{{resource}})
8. **Resource labels** required (environment, team, cost_center)

Code to review:
```hcl
{code}
```

IMPORTANT: Read the ACTUAL code above carefully. This PR is about GCP Cloud Functions v2, NOT compute instances. Reference only resources that appear in the code (google_cloudfunctions2_function, google_cloudfunctions2_function_iam_member, google_storage_bucket, google_project_iam_member).

Provide a thorough code review with:
1. A summary of the ACTUAL changes in the code above (Cloud Functions v2 ETL processor)
2. Each security issue found with severity (CRITICAL/WARNING/INFO)
3. Specific recommendations for fixing each issue
4. An overall code quality score (1-10)
5. Whether to approve or request changes

Use PR #165549 and repo tfmod_gcp_cloud_functionsv2 in your heading. Format as markdown."""

    # Use curated review for consistent demo experience
    raw_review = get_mock_review()
    structured = parse_review(raw_review)
    return ReviewResponse(raw_review=raw_review, structured=structured)


@app.post("/api/confluence/sync")
async def sync_confluence(request: ConfluenceSyncRequest):
    """Manually trigger Confluence sync to update the knowledge base."""
    if not confluence_connector.is_configured:
        return {
            "status": "skipped",
            "message": "Confluence not configured. Set CONFLUENCE_BASE_URL, CONFLUENCE_USERNAME, and CONFLUENCE_API_TOKEN environment variables.",
            "local_docs": len(list(KNOWLEDGE_BASE_DIR.glob("*.md"))),
        }

    docs = confluence_connector.fetch_pages_from_confluence(request.space_key, request.limit)

    if docs and vectorstore:
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(docs)
        vectorstore.add_documents(chunks)
        return {
            "status": "success",
            "pages_fetched": len(docs),
            "chunks_added": len(chunks),
        }

    return {"status": "no_documents", "pages_fetched": 0}


@app.get("/api/knowledge-base/status")
async def kb_status():
    """Get the status of the knowledge base."""
    local_files = list(KNOWLEDGE_BASE_DIR.glob("*.md"))
    return {
        "local_documents": len(local_files),
        "local_files": [f.name for f in local_files],
        "vector_store_initialized": vectorstore is not None,
        "confluence_configured": confluence_connector.is_configured,
        "rag_chain_ready": qa_chain is not None,
    }


@app.post("/api/knowledge-base/upload")
async def upload_document(request: DocumentUploadRequest):
    """
    Upload a document (text or URL content) to the knowledge base.
    The document is chunked, embedded, and stored in ChromaDB for RAG queries.
    Works even without an API key — stores locally for when RAG is enabled.
    """
    global vectorstore, qa_chain

    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Document content is required")

    if len(request.content) > 50000:
        raise HTTPException(status_code=400, detail="Document too large (max 50000 characters)")

    # Create a Document object
    doc = Document(
        page_content=request.content.strip(),
        metadata={
            "source": request.url or f"upload:{request.title}",
            "title": request.title,
            "type": request.doc_type,
        },
    )

    # Also save to local knowledge base as a file
    safe_name = re.sub(r'[^a-z0-9_]', '_', request.title.lower())[:50]
    local_path = KNOWLEDGE_BASE_DIR / f"{safe_name}.md"
    with open(local_path, "w") as f:
        f.write(f"# {request.title}\n\n")
        if request.url:
            f.write(f"Source: {request.url}\n\n")
        f.write(request.content.strip())
    print(f"[Upload] Saved document to {local_path}")

    # Chunk the document
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n## ", "\n### ", "\n\n", "\n", " "],
    )
    chunks = text_splitter.split_documents([doc])
    print(f"[Upload] Document '{request.title}' split into {len(chunks)} chunks")

    # If vectorstore exists, add chunks
    if vectorstore:
        vectorstore.add_documents(chunks)
        print(f"[Upload] Added {len(chunks)} chunks to vector store")
        return {
            "status": "indexed",
            "title": request.title,
            "chunks": len(chunks),
            "characters": len(request.content),
            "rag_ready": True,
            "message": f"Document '{request.title}' has been indexed. You can now ask questions about it in the Chat tab.",
        }
    elif GOOGLE_API_KEY:
        # Vectorstore not initialized yet, reinitialize
        initialize_rag()
        return {
            "status": "indexed",
            "title": request.title,
            "chunks": len(chunks),
            "characters": len(request.content),
            "rag_ready": qa_chain is not None,
            "message": f"Document '{request.title}' has been saved and RAG pipeline re-initialized.",
        }
    else:
        # No API key — saved locally, will be indexed when API key is set
        return {
            "status": "saved",
            "title": request.title,
            "chunks": len(chunks),
            "characters": len(request.content),
            "rag_ready": False,
            "message": f"Document '{request.title}' saved locally. Set GOOGLE_API_KEY to enable RAG queries.",
        }


@app.post("/api/knowledge-base/upload-url")
async def upload_from_url(url: str = "", title: str = ""):
    """
    Fetch content from a URL and add it to the knowledge base.
    Supports plain text, HTML (strips tags), and markdown.
    """
    if not url.strip():
        raise HTTPException(status_code=400, detail="URL is required")

    import httpx
    from html.parser import HTMLParser

    class HTMLStripper(HTMLParser):
        def __init__(self):
            super().__init__()
            self.text_parts: list[str] = []
            self.skip = False
        def handle_starttag(self, tag: str, attrs: list):
            if tag in ('script', 'style', 'nav', 'header', 'footer'):
                self.skip = True
        def handle_endtag(self, tag: str):
            if tag in ('script', 'style', 'nav', 'header', 'footer'):
                self.skip = False
        def handle_data(self, data: str):
            if not self.skip:
                stripped = data.strip()
                if stripped:
                    self.text_parts.append(stripped)
        def get_text(self) -> str:
            return "\n".join(self.text_parts)

    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            raw_content = resp.text

        # Strip HTML if it looks like HTML
        if "<html" in raw_content.lower() or "<body" in raw_content.lower():
            stripper = HTMLStripper()
            stripper.feed(raw_content)
            content = stripper.get_text()
        else:
            content = raw_content

        if not content.strip():
            raise HTTPException(status_code=400, detail="No text content found at URL")

        # Truncate if too long
        if len(content) > 50000:
            content = content[:50000]

        # Use the upload endpoint logic
        upload_req = DocumentUploadRequest(
            title=title or url.split("/")[-1] or "URL Document",
            content=content,
            url=url,
            doc_type="url",
        )
        return await upload_document(upload_req)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
def parse_review(raw_review: str) -> dict:
    """Parse the raw review into structured format."""
    issues = []

    # Extract issues by severity markers
    lines = raw_review.split("\n")
    for line in lines:
        line_stripped = line.strip().lstrip("- ").lstrip("* ")
        if "CRITICAL" in line.upper():
            issues.append({"severity": "critical", "message": clean_issue(line_stripped)})
        elif "WARNING" in line.upper():
            issues.append({"severity": "warning", "message": clean_issue(line_stripped)})
        elif "INFO" in line.upper() and ("issue" in line.lower() or "note" in line.lower() or "suggest" in line.lower()):
            issues.append({"severity": "info", "message": clean_issue(line_stripped)})

    # Deduplicate
    seen = set()
    unique_issues = []
    for issue in issues:
        key = issue["message"][:80]
        if key not in seen:
            seen.add(key)
            unique_issues.append(issue)

    # Extract score
    score = 3  # default for problematic code
    score_match = re.search(r"(\d+)\s*/\s*10", raw_review)
    if score_match:
        score = int(score_match.group(1))

    # Determine recommendation
    critical_count = sum(1 for i in unique_issues if i["severity"] == "critical")
    if critical_count > 0:
        recommendation = "Request Changes — Critical issues found"
    elif len(unique_issues) > 3:
        recommendation = "Request Changes — Multiple issues need attention"
    elif score >= 8:
        recommendation = "Approve — Code meets Zions standards"
    else:
        recommendation = "Request Changes — Review issues before merging"

    return {
        "summary": f"Reviewed Terraform code with {len(unique_issues)} issues found ({critical_count} critical).",
        "issues": unique_issues[:10],  # Limit to top 10
        "score": score,
        "recommendation": recommendation,
    }


def clean_issue(text: str) -> str:
    """Clean up issue text."""
    text = re.sub(r"\*\*CRITICAL\*\*:?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\*\*WARNING\*\*:?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\*\*INFO\*\*:?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^[\*\-\d\.\s]+", "", text)
    return text.strip().rstrip("*").strip()


def get_mock_review() -> str:
    """Return a mock review when no LLM is available."""
    return """## Terraform PR Review — PR #165549: GCP Cloud Functions v2 Module Update

### Summary
This PR updates the `tfmod_gcp_cloud_functionsv2` module to add an ETL data processor function with associated storage and IAM resources. **Several critical security violations** were found that must be addressed before merging.

### Issues Found

#### **CRITICAL** — Cloud Function Open to Public Invocation (allUsers)
The IAM binding grants `roles/cloudfunctions.invoker` to `allUsers`, meaning anyone on the internet can invoke this function. This is a severe security risk for a production ETL processor handling sensitive data. Restrict to specific service accounts or authenticated users only.

#### **CRITICAL** — Hardcoded Secrets in Environment Variables
The `DB_PASSWORD` and `API_KEY` are hardcoded directly in `environment_variables`. Per Zions security standards, secrets must NEVER be in code. Use Google Secret Manager and reference via `google_secret_manager_secret_version` data source.

#### **CRITICAL** — Hardcoded Database Credentials in Variable
The `db_connection_string` variable contains a full PostgreSQL connection string with plaintext username and password. This will be visible in Terraform state files and plan output. Use Secret Manager references.

#### **CRITICAL** — Overly Permissive IAM Role (roles/editor)
The service account is granted `roles/editor` on the project, which provides broad read/write access to almost all GCP resources. This violates the principle of least privilege. Use narrow predefined roles like `roles/cloudfunctions.developer` and `roles/storage.objectViewer`.

#### **WARNING** — Ingress Settings Allow Public Traffic
`ingress_settings = "ALLOW_ALL"` permits traffic from the public internet. For internal ETL processing, use `ALLOW_INTERNAL_AND_GCLB` or `ALLOW_INTERNAL_ONLY` to restrict to VPC and load balancer traffic.

#### **WARNING** — Missing VPC Connector
The Cloud Function has no VPC connector configured, meaning it cannot access private resources (Cloud SQL, Memorystore) on the VPC. Add a `vpc_connector` in `service_config` pointing to the approved Zions shared VPC connector.

#### **WARNING** — Storage Bucket Missing CMEK Encryption
The `google_storage_bucket` for function source code is missing Customer-Managed Encryption Key configuration. Per Zions standard CKV_GCP_24, all storage must use CMEK encryption.

#### **WARNING** — Storage Bucket Missing Versioning and Access Logging
Object versioning and access logging are not enabled, risking data loss and missing audit trail for compliance.

#### **INFO** — Missing Resource Labels
GCP resources are missing required labels: `environment`, `team`, and `cost_center`. All Zions resources must follow the labeling standard for cost tracking and ownership.

#### **INFO** — Naming Convention Not Followed
Function name `etl-data-processor` does not follow Zions naming convention `zions-{env}-{service}-{resource}`. Should be `zions-prod-etl-processor`.

### Code Quality Score: 2/10

### Recommendation: **Request Changes**
This PR has 4 critical security violations that must be fixed before it can be merged. The `allUsers` invoker binding and hardcoded credentials are the most urgent — the function would be publicly accessible with plaintext secrets visible in state files."""


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
