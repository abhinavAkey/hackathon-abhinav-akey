# Zions Bancorporation — Cloud Security Standards for Code Review

## Overview
All code deployed to Zions' cloud infrastructure must comply with these security standards. PR reviewers must verify compliance before approving.

## Authentication & Authorization
1. **No hardcoded credentials:** API keys, passwords, tokens, and service account keys must NEVER appear in code. Use Secret Manager or environment-injected secrets.
2. **Least privilege:** IAM roles must be scoped to the minimum required permissions. Never use `roles/owner` or `roles/editor` in Terraform. Prefer predefined narrow roles.
3. **Service account keys:** Avoid creating and downloading SA keys. Use Workload Identity Federation for GKE, and attached service accounts for Compute/Cloud Run.
4. **OAuth scopes:** Cloud API OAuth scopes must be limited to required APIs only.

## Network Security
1. **No public IPs:** Compute instances, GKE nodes, and Cloud SQL must not have public IPs. Use Cloud NAT for outbound, and Internal Load Balancers or Private Service Connect for inbound.
2. **Firewall rules:** No ingress rules with `0.0.0.0/0` source. All rules must have specific source ranges from approved Zions CIDR blocks.
3. **VPC design:** All workloads must reside in approved VPC networks. Shared VPC is preferred.
4. **Private endpoints:** Use Private Google Access and Private Service Connect for GCP API calls.

## Data Protection
1. **Encryption at rest:** All storage (GCS, BigQuery, Cloud SQL, Persistent Disks) must use CMEK (Customer-Managed Encryption Keys) from Zions' KMS.
2. **Encryption in transit:** All internal service-to-service communication must use mTLS or be within a service mesh.
3. **Data classification:** PII and financial data must be tagged and monitored. DLP scanning must be enabled for BigQuery datasets containing customer data.
4. **Backup & retention:** Production databases must have automated daily backups with 30-day retention.

## Logging & Monitoring
1. **Audit logging:** Admin Activity and Data Access audit logs must be enabled for all projects.
2. **VPC Flow Logs:** Must be enabled on all subnets with 5-minute aggregation.
3. **Cloud Armor:** All external-facing applications must use Cloud Armor WAF policies.
4. **Alerting:** Critical security events must route to PagerDuty within 5 minutes.

## Container Security
1. **Base images:** Only use approved base images from `us-central1-docker.pkg.dev/zions-shared-01/approved-bases/`.
2. **Vulnerability scanning:** Artifact Registry vulnerability scanning must be enabled. Block deployment of images with CRITICAL CVEs.
3. **No root:** Containers must not run as root. Use `USER nonroot` in Dockerfiles.
4. **Resource limits:** All Kubernetes pods must have CPU and memory limits defined.

## Terraform-Specific Standards
1. **State encryption:** Terraform state buckets must have CMEK encryption.
2. **Provider pinning:** All provider versions must be pinned to exact versions.
3. **Module sources:** Only modules from the approved `terraform-gcp-modules` repo may be used in production.
4. **Sensitive outputs:** Outputs containing secrets must use `sensitive = true`.

## PR Review Gate
All PRs modifying infrastructure code must:
- Pass `checkov` security scan (zero CRITICAL/HIGH findings)
- Pass `tflint` with Zions ruleset
- Have at least 1 approval from a Cloud Platform team member
- Include a rollback plan in the PR description for production changes

## Compliance References
- SOC 2 Type II controls
- PCI DSS requirements for financial data handling
- FFIEC guidelines for cloud computing
- Zions Internal Policy: CLD-SEC-001 through CLD-SEC-015
