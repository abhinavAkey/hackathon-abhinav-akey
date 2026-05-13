# Azure DevOps (ADO) Pipeline Template Guidelines — Zions Bancorporation

## Overview
All CI/CD pipelines at Zions must use the approved pipeline templates from the `zions-ado-templates` repository. This ensures consistency, security scanning, and compliance with Zions' deployment policies.

## Template Repository
- **Location:** `https://dev.azure.com/ZionsBancorp/CloudPlatform/_git/zions-ado-templates`
- **Branch Policy:** Only `main` branch templates are approved for production use

## Available Templates

### 1. terraform-plan-apply.yml
Standard Terraform plan and apply workflow with built-in:
- `tflint` linting
- `checkov` security scanning
- Cost estimation via Infracost
- Manual approval gate for production applies

**Usage:**
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

### 2. docker-build-push.yml
Container build and push to Artifact Registry:
```yaml
stages:
  - template: docker-build-push.yml@templates
    parameters:
      dockerfilePath: './Dockerfile'
      imageName: 'my-service'
      registry: 'us-central1-docker.pkg.dev/zions-shared-01/containers'
```

### 3. gke-deploy.yml
Kubernetes deployment to GKE clusters:
```yaml
stages:
  - template: gke-deploy.yml@templates
    parameters:
      cluster: 'zions-dev-gke-01'
      namespace: 'my-app'
      manifestPath: './k8s'
```

## Common Pipeline Errors

### Error: "The pipeline is not valid. Job Build: Step TerraformTaskV4 input command"
**Cause:** Using the raw `TerraformTaskV4` directly instead of the approved template.
**Fix:** Replace direct task usage with the `terraform-plan-apply.yml` template reference shown above. The template wraps `TerraformTaskV4` with proper inputs.

### Error: "Resource authorization failed"
**Cause:** The pipeline's service connection hasn't been authorized for the repository/environment.
**Fix:**
1. Go to Project Settings > Service Connections
2. Select the relevant service connection (e.g., `zions-gcp-dev`)
3. Click "Security" and add your pipeline to the authorized pipelines list

### Error: "Checkout of repository failed"
**Cause:** The template repository (`zions-ado-templates`) is not accessible from your project.
**Fix:** Ensure your project has read access to the `CloudPlatform` project. Contact the DevOps team if needed.

### Error: "checkov scan failed"
**Cause:** Your Terraform code has security violations detected by Checkov.
**Fix:** Review the Checkov output for specific policy violations. Common issues:
- Missing encryption at rest (CKV_GCP_24)
- Public IP on compute instance (CKV_GCP_38)
- Missing audit logging (CKV_GCP_15)
- Overly permissive firewall rules (CKV_GCP_2)

## Pipeline Variables
All pipelines must set these variables:
- `TF_VAR_project_id`: Target GCP project
- `TF_VAR_region`: GCP region (default: `us-central1`)
- `TF_VAR_environment`: `dev`, `staging`, or `prod`

## Approval Gates
- **Dev:** Auto-approved
- **Staging:** Requires 1 team lead approval
- **Production:** Requires 2 approvals (team lead + platform team)

## Support
For pipeline issues, reach out in the `#cloud-platform-support` Slack channel or create a ServiceNow incident.
