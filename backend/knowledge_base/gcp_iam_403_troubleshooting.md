# Troubleshooting GCP IAM 403 Forbidden Errors at Zions

## Overview
This document covers the most common GCP IAM 403 Forbidden errors encountered by developers at Zions Bancorporation and how to resolve them.

## Common 403 Error Scenarios

### 1. Terraform Service Account Permission Denied
**Error:** `Error 403: Permission 'iam.serviceAccounts.actAs' denied on resource 'projects/zions-prod-01/serviceAccounts/sa-iac-creator-01@zions-prod-01.iam.gserviceaccount.com'`

**Root Cause:** Your user account or CI/CD service account does not have the `iam.serviceAccountUser` role on the target service account `sa-iac-creator-01`.

**Resolution Steps:**
1. Open a ServiceNow request (type: "Request GCP Access")
2. Request the `roles/iam.serviceAccountUser` role on the service account `sa-iac-creator-01@zions-prod-01.iam.gserviceaccount.com`
3. Include your GCP user email and the project ID in the request
4. The Cloud Platform team will approve within 1-2 business days
5. After approval, re-run your Terraform pipeline

**Alternative:** If you are a project owner, you can grant the role via:
```bash
gcloud iam service-accounts add-iam-policy-binding \
  sa-iac-creator-01@zions-prod-01.iam.gserviceaccount.com \
  --member="user:your.email@zionsbancorp.com" \
  --role="roles/iam.serviceAccountUser" \
  --project=zions-prod-01
```
Note: This requires `iam.serviceAccounts.setIamPolicy` which most developers do not have in production.

### 2. Compute Engine Default Service Account
**Error:** `Error 403: Required 'compute.instances.create' permission for 'projects/zions-dev-analytics'`

**Root Cause:** Missing `roles/compute.instanceAdmin.v1` role on the project.

**Resolution:** Submit a ServiceNow ticket requesting the Compute Instance Admin role on the specific project.

### 3. BigQuery Access Denied
**Error:** `Error 403: Access Denied: Table zions-prod-01:dataset.table: User does not have permission to query table`

**Root Cause:** Missing `roles/bigquery.dataViewer` or `roles/bigquery.jobUser` on the project/dataset.

**Resolution:** Request BigQuery Data Viewer role via ServiceNow. For cross-project queries, ensure you have both `bigquery.jobUser` on your home project and `bigquery.dataViewer` on the target project.

### 4. Cloud Storage Permission Denied
**Error:** `Error 403: your.email@zionsbancorp.com does not have storage.objects.get access to the Google Cloud Storage object`

**Root Cause:** Missing `roles/storage.objectViewer` on the bucket or project.

**Resolution:** Submit ServiceNow request for Storage Object Viewer role.

## General IAM Request Process at Zions
1. Navigate to ServiceNow portal (https://zionsbank.service-now.com)
2. Select "Request GCP Access" from the catalog
3. Fill in: Project ID, Role needed, Business justification
4. Your manager will receive an approval notification
5. After manager + Cloud Platform team approval, the role is granted
6. Average turnaround: 1-2 business days (expedited for incidents: 2-4 hours)

## Emergency Access
For production incidents requiring immediate IAM access:
1. Contact the Cloud Platform on-call via PagerDuty
2. Reference your incident ticket number
3. Emergency access can be granted within 30 minutes
4. Emergency access is temporary (72 hours) and must be followed up with a proper ServiceNow request

## Best Practices
- Always use the principle of least privilege
- Request project-level roles, not organization-level roles
- Use service accounts for automation, not personal accounts
- Review your IAM permissions quarterly using the IAM Recommender
- Never share service account keys — use Workload Identity Federation
