# Goalie Process & Common Issues at Zions Bancorporation

## What is the Goalie Role?
The Goalie is a rotating role on the Cloud Platform team responsible for:
- Reviewing and approving incoming PRs for Terraform/IAM changes
- Triaging pipeline failures and state lock issues
- Handling escalations from developers
- Ensuring compliance with Zions security standards before merging

## Known Goalie Issues (Identified Pain Points)

### 1. No SLA-Based Ticket Processing
- Ticket processing is very tedious and time consuming with too many manual pings
- There is no automated SLA tracking for PR reviews or escalations
- **Recommendation:** Use DevKick's Tickets tab to create tracked ServiceNow tickets with priority and SLA

### 2. No Cost Center Validation
- PRs are being approved without verifying cost center information
- Missing cost center validation leads to billing issues downstream
- **Recommendation:** Ensure all Terraform PRs include `cost_center` label on resources

### 3. PR Approval Bottleneck
- The Goalie role often becomes "mostly just approving PRs"
- With so many PRs and so many changes, it's hard to keep track of what is what
- PR review is sometimes neglected and PRs are directly approved to save time
- **Recommendation:** Use DevKick's Review tab for automated first-pass review

### 4. No Proper Communication Medium
- All communication happens via Slack channels and context gets lost
- No tracking of conversations about PR issues or escalations
- **Recommendation:** Use DevKick's Chat to document issues and escalate with full conversation context

### 5. Missing Validation Checks on PRs
- PRs should have validation checks that must pass before reaching the Goalie
- Same PRs and pipelines need re-approval due to errors that should have been caught earlier
- Developers are reapproving the same PRs and pipelines repeatedly
- **Recommendation:** Implement pre-merge validation pipeline using approved templates

### 6. IAM Group and Entitlement Issues
- No way to easily tell which IAM configuration is correct vs incorrect
- People create PRs one after another and the Goalie has no control — all have to be reviewed
- Groups are not being created but people are adding entitlements to them without checking if the IAM group exists
- This requires tedious investigation by the Goalie
- **Recommendation:** Add automated IAM group existence checks in the pipeline

### 7. Terraform State Lock Issues
- State lock issues affect all pipelines and require manually deleting locks
- There should be a proper mechanism to maintain track so pipelines won't have issues
- **Recommendation:** Use `terraform force-unlock` carefully, and implement state lock monitoring

### 8. Pipeline Rerun Timing Issues
- Failed jobs sometimes work on rerun because IAM resources weren't yet available
- The next steps fail when IAM plan resources aren't provisioned in time
- **Recommendation:** Add retry with exponential backoff in pipeline templates, or add wait steps after IAM changes

### 9. Developers Not Reading Documentation
- People are not looking at IAM docs written by the platform team
- They use random files in the messages folder instead of approved templates
- They create configurations with nonexistent group names and resources
- PR review becomes very hard to keep track of
- **Recommendation:** Surface documentation directly in DevKick and show validation errors before PR submission

### 10. GCP API Drift
- Sometimes the GCP Google API causes drift and a rerun fixes IAM issues
- **Recommendation:** Implement drift detection in pipelines and auto-retry on known drift errors

### 11. Lack of Awareness
- People are just "reforming a dot" (making minor changes) without understanding what they're doing
- Developers need to be made aware of what their changes actually affect
- **Recommendation:** Use DevKick's Standards tab to educate developers on IAM best practices

## Escalation Process
When a developer encounters an issue that needs Goalie attention:

### From DevKick Chat (Recommended):
1. Describe the issue in the Chat tab
2. Click the **"Escalate"** button on any message
3. DevKick creates a ServiceNow ticket pre-filled with:
   - The conversation context
   - Error details
   - Recommended resolution from the knowledge base
4. The ticket is tagged for **Goalie Review**
5. Goalie sees it in their queue with full context

### From DevKick Tickets Tab:
1. Go to Tickets tab
2. Select "Goalie Escalation" type
3. Fill in issue details
4. Submit — ticket is routed to Goalie queue

### Priority Levels for Escalations:
- **Critical:** Production pipeline blocked, state lock affecting multiple teams
- **High:** PR blocked on IAM issue, missing group/entitlement
- **Medium:** Pipeline failure needing rerun, cost center validation needed
- **Low:** Documentation question, process clarification

## Goalie Review Queue
The Goalie reviews escalations in this order:
1. Critical production blockers (SLA: 30 minutes)
2. High-priority IAM/pipeline issues (SLA: 2 hours)
3. Medium-priority reruns and validations (SLA: 4 hours)
4. Low-priority questions (SLA: 1 business day)
