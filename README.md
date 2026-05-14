# Zions DevKick — The Centralized Developer Assistant

> **Hackathon Project** — A Chrome/Edge Side Panel extension that eliminates the 4 biggest developer bottlenecks at Zions Bancorporation, turning a 1-hour context-switching nightmare into a 2-minute seamless workflow.

---

## The Problem

Developers at Zions waste hours every day context-switching between tools:

| Bottleneck | Pain Point | Time Wasted |
|---|---|---|
| **"Why did this fail?"** | Staring at a Terraform GCP `403 Forbidden` error, then searching Confluence for 30 minutes | 30-60 min/incident |
| **PR Review** | Context-switching to ADO, parsing massive YAML/Terraform diffs, writing meaningful review comments | 20-40 min/PR |
| **IT Service Requests** | Stopping work to navigate ServiceNow just to request IAM access or file a bug | 15-30 min/request |
| **"Where is that link?"** | Digging through bookmarks to find the right ADO template repo or Confluence runbook | 5-10 min/search |

**Total:** Up to 2+ hours/day per developer lost to tool-hopping and searching.

---

## The Solution: Zions DevKick

A **Chrome/Edge Side Panel extension** that brings everything into one place — right where the developer already works.

### 4 Tabs, 4 Bottlenecks Solved

#### 1. Chat Tab — AI-Powered Troubleshooting
- **RAG-powered chatbot** backed by Zions' internal knowledge base
- Answers questions about GCP IAM errors, ADO pipeline failures, internal processes
- **ChromaDB vector store** for semantic search across documentation
- **Confluence connector** (configurable for live or mocked data)
- Quick prompt buttons for common scenarios
- Chat history persistence + export

#### 2. Review Tab — Automated PR Code Review
- One-click **"Analyze Current PR"** button
- Detects if you're on an ADO/GitHub PR page
- Sends code to AI for review against Zions security standards:
  - No public IPs on compute instances
  - No overly permissive firewall rules (0.0.0.0/0)
  - CMEK encryption required for all storage
  - No hardcoded secrets
  - Least privilege IAM roles
- Returns structured results: score, issues by severity, recommendation
- Copy review to clipboard for pasting into PR comments

#### 3. Tickets Tab — ServiceNow Integration
- Create ServiceNow tickets without leaving your browser
- Support for: Incidents, GCP Access Requests, **Goalie Escalations**, Bugs, Change Requests
- **Goalie Escalation type** — routes directly to Goalie Review Queue with SLA tracking
- **Goalie Queue Dashboard** — view active escalations, their status, priority, and assignee
- Priority selection: Low / Medium / High / Critical
- Mocked 2-second submission with realistic RITM number
- Recent tickets history

#### Escalation Flow (Chat -> Tickets -> Goalie Queue)
- **From Chat:** Hover over any message and click "Escalate to Goalie" — creates a ticket pre-filled with conversation context
- **From Chat:** Click "Create Ticket" to generate a ServiceNow ticket from any message
- **From Tickets:** Select "Goalie" type to create a Goalie escalation directly
- **Goalie Queue:** View all active escalations with status, priority, age, and assignee
- Addresses real Goalie pain points: state locks, IAM group issues, pipeline reruns, PR review bottlenecks

#### 4. Actions Tab — One-Stop Developer Hub
- **Quick Links** — One-click access to 8 essential tools:
  - ADO Template Repo, GCP Console, Confluence, ServiceNow
  - Terraform Modules, Security Docs, Azure DevOps, GCP IAM Admin
- **Notifications/Reminders** — Sprint deadlines, code freeze alerts, training due dates
- **Developer Standards** — Expandable checklists:
  - PR Standards (title format, reviewer requirements, max size)
  - Story Definition of Done (coverage, tests, docs, security)
  - Pipeline Standards (approved templates, stages, secrets management)
  - Terraform Standards (modules, state, naming, labels)
  - Security Checklist (public IPs, firewall, encryption, VPC)
- **Repo Bootstrap** — Create new repos from approved Zions templates

---

## Architecture

```
┌─────────────────────────────────────────────┐
│         Chrome/Edge Side Panel              │
│  ┌─────┬────────┬─────────┬─────────┐       │
│  │Chat │ Review │ Tickets │ Actions │       │
│  └──┬──┴───┬────┴────┬────┴─────────┘       │
│     │      │         │                       │
│     │  React + Tailwind CSS + Vite           │
└─────┼──────┼─────────┼───────────────────────┘
      │      │         │
      ▼      ▼         ▼
┌─────────────────────────────────────────────┐
│         FastAPI Backend (:8000)              │
│  ┌──────────────────────────────────┐       │
│  │  /api/chat    — RAG + LLM       │       │
│  │  /api/review  — Code Review LLM │       │
│  │  /api/confluence/sync           │       │
│  │  /api/knowledge-base/status     │       │
│  └──────────┬───────────────────────┘       │
│             │                                │
│  ┌──────────▼───────────────────────┐       │
│  │  ChromaDB Vector Store           │       │
│  │  (Embedded, local)               │       │
│  └──────────┬───────────────────────┘       │
│             │                                │
│  ┌──────────▼───────────────────────┐       │
│  │  Knowledge Base (5 docs)         │       │
│  │  + Confluence Connector          │       │
│  └──────────────────────────────────┘       │
└─────────────────────────────────────────────┘
      │
      ▼
┌──────────────┐
│  Google Gemini  │
│  Gemini 2.5 Flash │
└──────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + TypeScript | Component-based UI with type safety |
| **Styling** | Tailwind CSS 3.4 | Rapid, consistent, modern styling |
| **Build** | Vite 6 | Fast builds, HMR for development |
| **Icons** | Lucide React | Clean, consistent icon set |
| **Backend** | Python FastAPI | Async, fast, auto-documented API |
| **AI/LLM** | Google Gemini 2.5 Flash | Fast, cost-effective inference |
| **RAG** | LangChain + ChromaDB | Document chunking + vector search |
| **Embeddings** | text-embedding-004 | Efficient semantic embeddings |

---

## Quick Start

### Prerequisites

| Tool | Version | How to check | Install |
|---|---|---|---|
| **Node.js** | 18+ | `node --version` | [nodejs.org](https://nodejs.org) — download LTS installer |
| **Python** | 3.10+ | `python --version` | [python.org](https://python.org) — check "Add to PATH" during install |
| **npm** | (comes with Node) | `npm --version` | Included with Node.js |
| **pip** | (comes with Python) | `pip --version` | Included with Python |
| **Edge or Chrome** | Latest | Already installed | Edge is pre-installed on Windows |
| **Google Gemini API Key** | — | — | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

> **Note:** On corporate Windows machines, if `python` is not found, try `python3` or `py` instead. If you can't install Node/Python, check if they're available via your company's software center.

---

### Step 1: Build the Extension

Open **PowerShell** or **Command Prompt**, navigate to the project folder:

**Windows (PowerShell):**
```powershell
cd extension
npm install
npm run build

# Copy manifest and icons to the dist folder
copy manifest.json dist\
xcopy public\icons dist\icons\ /E /I /Y
```

**Windows (Command Prompt):**
```cmd
cd extension
npm install
npm run build
copy manifest.json dist\
xcopy public\icons dist\icons\ /E /I /Y
```

**Mac/Linux:**
```bash
cd extension
npm install
npm run build
cp manifest.json dist/
cp -r public/icons dist/
```

You should see output like:
```
✓ built in 3.xx s
```

---

### Step 2: Load Extension in Edge (or Chrome)

1. Open Edge and go to: **`edge://extensions`**
   - (For Chrome: `chrome://extensions`)
2. Toggle **"Developer mode"** ON (bottom-left in Edge, top-right in Chrome)
3. Click **"Load unpacked"**
4. Browse to and select the **`extension/dist`** folder
   - Example path: `C:\Users\YourName\Documents\Hackathon-Zions\extension\dist`
5. The **DevKick** icon (blue "DK" logo) appears in your toolbar
6. Click it to open the side panel
7. You should see the DevKick UI with 4 tabs: Chat, Review, Tickets, Actions

> **Tip:** If the side panel doesn't open on click, right-click the extension icon and select "Open side panel".

> **Troubleshooting:** If you see a blank white panel, make sure you ran `npm run build` and copied the manifest/icons to `dist/`. The `dist/index.html` should contain `src="./assets/..."` (relative paths with `./`).

---

### Step 3: Start the Backend

Open a **new** PowerShell/terminal window (keep this running during the demo):

**Windows (PowerShell):**
```powershell
cd backend

# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate

# Upgrade pip (recommended)
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt

# Create your .env file
copy .env.example .env

# NOW EDIT .env — add your Google Gemini API key:
# Open in notepad:
notepad .env
# Change the line: GOOGLE_API_KEY=your-google-api-key-here
# Save and close notepad

# Start the server
uvicorn main:app --reload --port 8000
```

**Windows (Command Prompt):**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
notepad .env
uvicorn main:app --reload --port 8000
```

**Mac/Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
nano .env   # or: code .env
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started reloader process
```

**Verify it works:** Open `http://localhost:8000` in your browser — you should see:
```json
{"name":"Zions DevKick API","version":"1.0.0","status":"running",...}
```

**Verify the API docs:** Open `http://localhost:8000/docs` — you'll see the interactive Swagger UI.

---

### Step 4: Verify Everything Works Together

1. Make sure the **backend is running** (terminal shows `Uvicorn running on http://0.0.0.0:8000`)
2. Open **Edge** and go to any webpage
3. Click the **DevKick** extension icon to open the side panel
4. The header should show a **green dot** (backend connected)
5. In the **Chat tab**, click **"Terraform 403 Error"** quick prompt
6. You should get a detailed response about IAM permissions

> **If you see "Connection Error":** The backend is not running. Go back to Step 3.

> **If you see a yellow dot:** The backend is starting up. Wait a few seconds and it will turn green.

---

### Step 5: Verify Google Gemini Configuration

The backend is configured to use Google Gemini by default. Verify your `.env` has:

```env
GOOGLE_API_KEY=your-google-api-key
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
MODEL_NAME=gemini-2.5-flash
```

The backend uses Google's OpenAI-compatible endpoint for seamless integration.

---

### Step 6: (Optional) Connect Live Confluence

If you have Confluence API access, add these to your `.env`:

```env
CONFLUENCE_BASE_URL=https://your-company.atlassian.net
CONFLUENCE_USERNAME=your.email@company.com
CONFLUENCE_API_TOKEN=your-confluence-api-token
CONFLUENCE_SPACE_KEY=CP
```

Then restart the backend. It will auto-fetch Confluence pages on startup.

To manually sync: `POST http://localhost:8000/api/confluence/sync`

---

### Quick Reference: Commands Cheat Sheet

| Task | Windows (PowerShell) | Mac/Linux |
|---|---|---|
| Build extension | `cd extension && npm run build` | Same |
| Copy manifest to dist | `copy manifest.json dist\` | `cp manifest.json dist/` |
| Copy icons to dist | `xcopy public\icons dist\icons\ /E /I /Y` | `cp -r public/icons dist/` |
| Create Python venv | `python -m venv venv` | `python3 -m venv venv` |
| Activate venv | `.\venv\Scripts\Activate` | `source venv/bin/activate` |
| Start backend | `uvicorn main:app --reload --port 8000` | Same |
| Check backend | Open `http://localhost:8000` | Same |
| Load extension | `edge://extensions` → Load unpacked | `chrome://extensions` |

---

## Development

### Extension Development (with HMR)

```bash
cd extension
npm run dev
```

This starts a Vite dev server. For extension development, you'll still need to build and reload the extension in Chrome, but you can use the dev server URL for rapid UI iteration.

### Backend Development

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The `--reload` flag enables auto-reload on file changes.

### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Service info & status |
| `/health` | GET | Health check |
| `/api/chat` | POST | RAG-powered chat (message + history) |
| `/api/review` | POST | PR code review (url + optional code_snippet) |
| `/api/confluence/sync` | POST | Sync Confluence pages to vector store |
| `/api/knowledge-base/status` | GET | Knowledge base status |

---

## Knowledge Base Documents

The mocked knowledge base includes 5 comprehensive documents simulating real Zions Confluence pages:

| Document | Content |
|---|---|
| `gcp_iam_403_troubleshooting.md` | Common 403 errors, resolution steps, emergency access process |
| `ado_template_guidelines.md` | ADO pipeline templates, usage examples, common errors |
| `servicenow_request_process.md` | Request types (INC/RITM/CHG), SLAs, catalog items |
| `terraform_best_practices.md` | Project structure, security requirements, naming conventions |
| `zions_security_standards.md` | Auth, network, data protection, container security standards |

---

## Developer Standards (Built-in)

DevKick surfaces these standards directly in the Actions tab:

### PR Standards
- PR title must follow: `[ADO Work Item ID] Short description`
- At least 1 reviewer from your team required
- All Checkov/tflint scans must pass before merge
- Description must include: What, Why, Testing, and Rollback plan
- Max PR size: 400 lines changed

### Story Definition of Done
- Code reviewed and approved by at least 1 peer
- Unit tests with >80% code coverage
- Integration tests pass in CI/CD pipeline
- Documentation updated
- No open CRITICAL/HIGH security findings
- Deployed to staging and smoke-tested

### Pipeline Standards
- Use approved templates from `zions-ado-templates` repo
- All pipelines: lint → test → security scan → deploy
- Production deploys require 2 approvals
- Secrets from Azure Key Vault or GCP Secret Manager only

### Terraform Standards
- Use shared modules from `terraform-gcp-modules`
- State in GCS with CMEK encryption
- Provider versions pinned
- Follow naming: `zions-{env}-{service}-{resource}`

### Security Checklist
- No public IPs on compute instances
- No `0.0.0.0/0` ingress firewall rules
- CMEK encryption for all storage
- VPC Flow Logs enabled
- Approved container base images only

---

## Demo Script

### The Story: A Developer's Worst Day

**Step 1 — The Error:**
> "I'm a developer, and my Terraform deployment just failed with a 403 error. Usually, I'd lose 30 minutes hunting documentation."

**Step 2 — The Chat:**
Open the Side Panel → Chat tab. Ask the chatbot what the error means. It reads the mocked Confluence docs and tells you exactly what service account is missing permissions.

**Step 3 — ServiceNow:**
> "Now I know I need access. Instead of logging into ServiceNow, I just click the Tickets tab..."

Fill out the form → get the fake RITM number instantly.

**Step 4 — PR Review:**
> "Finally, my teammate needs a review. I click the Review tab, and the AI analyzes the PR against our Zions security standards immediately."

**Step 5 — The Drop-the-Mic Conclusion:**
> "We just turned a 1-hour context-switching nightmare into a 2-minute seamless workflow. That is the power of a centralized Dev Assistant."

---

## Mock vs. Real Components

| Component | Mock/Real | Details |
|---|---|---|
| Side Panel Extension | **Real** | Fully functional in Chrome/Edge |
| AI Chat | **Real AI, Mocked KB** | Real LLM with hardcoded Confluence docs |
| RAG/Vector Store | **Real** | ChromaDB with LangChain |
| Confluence Connector | **Ready** | Works if credentials provided, else uses local KB |
| PR Review | **Half/Half** | Hardcoded code snippet, real LLM analysis |
| ServiceNow Tickets | **Mocked** | 2s spinner + fake RITM number |
| Quick Links | **Real** | Actually open URLs in new tabs |
| Repo Bootstrap | **Mocked** | Simulated creation with success animation |
| Developer Standards | **Real** | Actual standards content displayed |

---

## Project Structure

```
Hackathon-Zions/
├── extension/                   # Chrome/Edge extension
│   ├── src/
│   │   ├── main.tsx            # React entry point
│   │   ├── App.tsx             # Main app with tab navigation
│   │   ├── index.css           # Tailwind + custom styles
│   │   ├── background.ts      # Service worker (side panel trigger)
│   │   └── components/
│   │       ├── ChatTab.tsx     # RAG-powered AI chatbot
│   │       ├── ReviewTab.tsx   # PR code review
│   │       ├── TicketsTab.tsx  # ServiceNow ticket creation
│   │       └── ActionsTab.tsx  # Quick links + standards + bootstrap
│   ├── public/icons/           # Extension icons (16/48/128px)
│   ├── manifest.json           # Chrome Extension manifest v3
│   ├── index.html              # Side panel HTML
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── dist/                   # Built extension (load this in Chrome)
│
├── backend/                     # FastAPI backend
│   ├── main.py                 # API server + RAG pipeline
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variable template
│   └── knowledge_base/         # Mocked Confluence documents
│       ├── gcp_iam_403_troubleshooting.md
│       ├── ado_template_guidelines.md
│       ├── servicenow_request_process.md
│       ├── terraform_best_practices.md
│       └── zions_security_standards.md
│
└── README.md                    # This file
```

---

## Future Enhancements

- **Live Confluence Integration** — Real-time sync with Confluence REST API
- **Live ServiceNow Integration** — Create actual ServiceNow tickets via API
- **ADO Pipeline Status** — Show real pipeline run status in the side panel
- **GitHub/ADO PR Diff Parsing** — Scrape actual PR diffs via API for real code review
- **Team Dashboard** — Show team metrics, sprint progress, and blockers
- **Slack Integration** — Post review summaries and ticket updates to team channels
- **Custom Knowledge Bases** — Upload your own docs to the RAG pipeline
- **Multi-tenant Support** — Support for different teams with different knowledge bases

---

## License

Internal Hackathon Project — Zions Bancorporation

Built with React, Tailwind CSS, FastAPI, LangChain, ChromaDB, and Google Gemini.
