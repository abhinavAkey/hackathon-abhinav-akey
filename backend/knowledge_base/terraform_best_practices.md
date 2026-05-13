# Terraform Best Practices at Zions Bancorporation

## Overview
This guide covers Terraform coding standards, security requirements, and best practices enforced across all Zions GCP infrastructure projects.

## Project Structure
```
infra/
├── main.tf           # Primary resource definitions
├── variables.tf      # Input variable declarations
├── outputs.tf        # Output value declarations
├── providers.tf      # Provider configuration
├── backend.tf        # State backend configuration
├── versions.tf       # Terraform and provider version constraints
├── terraform.tfvars  # Variable values (DO NOT commit secrets)
└── modules/          # Local modules (prefer shared modules)
```

## State Management
- **Backend:** All projects must use GCS backend with state locking
- **Bucket naming:** `zions-tfstate-{environment}-{project-shortname}`
- **State encryption:** GCS buckets must have CMEK encryption enabled
```hcl
terraform {
  backend "gcs" {
    bucket = "zions-tfstate-dev-myproject"
    prefix = "terraform/state"
  }
}
```

## Security Requirements (Enforced by Checkov)

### Mandatory Checks
1. **CKV_GCP_24:** Ensure encryption at rest for all storage resources
2. **CKV_GCP_38:** No public IPs on compute instances (use Cloud NAT)
3. **CKV_GCP_15:** Audit logging must be enabled
4. **CKV_GCP_2:** No overly permissive firewall rules (no 0.0.0.0/0 ingress)
5. **CKV_GCP_11:** Enable VPC Flow Logs
6. **CKV_GCP_7:** Ensure private cluster for GKE
7. **CKV_GCP_12:** Network policy enabled for GKE clusters

### Common Violations and Fixes

**Public IP on VM (CKV_GCP_38):**
```hcl
# BAD - will fail Checkov
resource "google_compute_instance" "vm" {
  network_interface {
    access_config {} # This assigns a public IP
  }
}

# GOOD - no public IP, uses Cloud NAT
resource "google_compute_instance" "vm" {
  network_interface {
    network    = google_compute_network.vpc.id
    subnetwork = google_compute_subnetwork.subnet.id
    # No access_config block = no public IP
  }
}
```

**Overly permissive firewall (CKV_GCP_2):**
```hcl
# BAD - allows all traffic from internet
resource "google_compute_firewall" "allow_all" {
  source_ranges = ["0.0.0.0/0"]
  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
}

# GOOD - specific IP ranges and ports
resource "google_compute_firewall" "allow_specific" {
  source_ranges = ["10.0.0.0/8"]
  allow {
    protocol = "tcp"
    ports    = ["443", "8080"]
  }
}
```

## Shared Modules
Always prefer shared modules from the `terraform-gcp-modules` repository:
- `modules/gcs-bucket` — Standard GCS bucket with encryption and logging
- `modules/gke-cluster` — GKE cluster with security hardening
- `modules/cloud-sql` — Cloud SQL with HA and backup
- `modules/vpc-network` — VPC with standard subnet layout

## Naming Conventions
- Resources: `{company}-{env}-{service}-{resource}` (e.g., `zions-dev-analytics-vm-01`)
- Projects: `zions-{env}-{service}` (e.g., `zions-prod-payments`)
- Service Accounts: `sa-{purpose}@{project}.iam.gserviceaccount.com`

## Code Review Checklist for Terraform PRs
- [ ] No hardcoded secrets or API keys
- [ ] Variables have descriptions and appropriate types
- [ ] Outputs are defined for resources other modules may need
- [ ] Provider version is pinned
- [ ] Terraform version is constrained
- [ ] Checkov passes with no violations
- [ ] State backend is properly configured
- [ ] Resources follow naming conventions
- [ ] Least privilege IAM roles are used
- [ ] Sensitive variables use `sensitive = true`
