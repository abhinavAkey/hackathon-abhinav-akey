# ServiceNow Request Process at Zions Bancorporation

## Overview
ServiceNow is Zions' primary IT Service Management (ITSM) platform. All IT requests, incidents, and change requests must go through ServiceNow for tracking, approval, and audit purposes.

## Request Types

### 1. Incident (INC)
**When to use:** Something is broken in production.
- **SLA:** P1 Critical: 1 hour response, P2 High: 4 hours, P3 Medium: 1 business day, P4 Low: 3 business days
- **Auto-routing:** Incidents are routed based on the Configuration Item (CI) selected
- **Escalation:** P1 incidents automatically page the on-call team

### 2. Request Item (RITM)
**When to use:** You need something new — access, software, hardware, etc.
- **GCP IAM Access:** Select "Request GCP Access" catalog item
  - Required fields: Project ID, Role, Business Justification
  - Approval chain: Manager → Cloud Platform Team
  - SLA: 1-2 business days (expedited: 2-4 hours for incidents)
- **New Repository:** Select "Create ADO Repository" catalog item
  - Requires: Template selection, team name, project name
  - Auto-creates repo from template with proper branch policies
- **Software Installation:** Select "Software Request" catalog item
  - Pre-approved software is auto-fulfilled
  - Non-standard software requires Security review

### 3. Change Request (CHG)
**When to use:** Making a planned change to production infrastructure.
- **Standard Changes:** Pre-approved, auto-fulfills (e.g., scaling up a VM)
- **Normal Changes:** Requires CAB (Change Advisory Board) approval
- **Emergency Changes:** Expedited path for critical fixes, post-approval within 48 hours

## How to Submit a Request

### Via ServiceNow Portal
1. Go to https://zionsbank.service-now.com
2. Click "Service Catalog" in the top navigation
3. Browse or search for the relevant catalog item
4. Fill in all required fields
5. Click "Submit"
6. You'll receive an email with your RITM/INC/CHG number

### Via DevKick (This Extension!)
1. Click the Tickets tab in DevKick
2. Select the request type
3. Fill in the form
4. Click "Submit to ServiceNow"
5. The ticket is created and you get the RITM number instantly

## Common Catalog Items for Developers
| Catalog Item | RITM Prefix | Typical SLA |
|---|---|---|
| Request GCP Access | RITM | 1-2 days |
| Request Azure Access | RITM | 1-2 days |
| New ADO Repository | RITM | 4 hours |
| VPN Access | RITM | 1 day |
| Software Installation | RITM | 2-3 days |
| Firewall Rule Change | CHG | 3-5 days |

## Tracking Your Requests
- All requests are visible in "My Requests" on the ServiceNow portal
- Email notifications are sent at each status change
- You can add comments/updates to existing tickets via email reply or the portal

## Tips
- Include as much detail as possible in the description to avoid back-and-forth
- For GCP access, always specify the exact role (e.g., `roles/iam.serviceAccountUser`) not just "admin access"
- Reference related tickets or incident numbers to speed up approval
- Use the "Watch List" feature to CC your team lead for faster approval
