# Infrastructure as Code (IaC)

Fund-My-Cause uses Terraform to define and manage all infrastructure resources on AWS. This document covers setup, deployment, and best practices.

## Overview

The infrastructure is defined in the `terraform/` directory and includes:

- **VPC & Networking**: Multi-AZ VPC with public/private subnets, NAT gateways, and route tables
- **Load Balancing**: Application Load Balancer (ALB) with health checks
- **Container Orchestration**: ECS Fargate cluster with auto-scaling
- **Database**: RDS PostgreSQL with multi-AZ failover
- **CDN**: CloudFront distribution for static assets
- **Logging**: CloudWatch log groups for ECS tasks
- **Security**: Security groups, IAM roles, and encryption

## Directory Structure

```
terraform/
├── main.tf              # Core infrastructure resources
├── variables.tf         # Variable definitions
├── outputs.tf           # Output values
├── dev.tfvars           # Development environment variables
├── staging.tfvars       # Staging environment variables
└── prod.tfvars          # Production environment variables
```

## Prerequisites

### Local Development

1. **Terraform** (>= 1.0)
   ```bash
   brew install terraform  # macOS
   # or download from https://www.terraform.io/downloads
   ```

2. **AWS CLI** (>= 2.0)
   ```bash
   brew install awscli  # macOS
   aws configure
   ```

3. **AWS Credentials**
   - Configure AWS credentials with appropriate permissions
   - Recommended: Use IAM roles with least privilege

### AWS Account Setup

1. **S3 Bucket for State**
   ```bash
   aws s3api create-bucket \
     --bucket fund-my-cause-terraform-state \
     --region us-east-1
   
   aws s3api put-bucket-versioning \
     --bucket fund-my-cause-terraform-state \
     --versioning-configuration Status=Enabled
   
   aws s3api put-bucket-encryption \
     --bucket fund-my-cause-terraform-state \
     --server-side-encryption-configuration '{
       "Rules": [{
         "ApplyServerSideEncryptionByDefault": {
           "SSEAlgorithm": "AES256"
         }
       }]
     }'
   ```

2. **DynamoDB Table for State Locking**
   ```bash
   aws dynamodb create-table \
     --table-name terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
   ```

## Configuration

### Environment Variables

Each environment has a `.tfvars` file:

**dev.tfvars**
```hcl
environment = "development"
ecs_desired_count = 1
ecs_min_capacity = 1
ecs_max_capacity = 2
rds_instance_class = "db.t3.micro"
```

**staging.tfvars**
```hcl
environment = "staging"
ecs_desired_count = 2
ecs_min_capacity = 2
ecs_max_capacity = 4
rds_instance_class = "db.t3.small"
```

**prod.tfvars**
```hcl
environment = "production"
ecs_desired_count = 3
ecs_min_capacity = 3
ecs_max_capacity = 10
rds_instance_class = "db.t3.medium"
```

### State Management

Uncomment the backend configuration in `main.tf` to enable remote state:

```hcl
backend "s3" {
  bucket         = "fund-my-cause-terraform-state"
  key            = "prod/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-locks"
}
```

## Deployment

### Local Deployment

1. **Initialize Terraform**
   ```bash
   cd terraform
   terraform init
   ```

2. **Plan Changes**
   ```bash
   terraform plan -var-file="staging.tfvars" -out=tfplan
   ```

3. **Review Plan**
   ```bash
   terraform show tfplan
   ```

4. **Apply Changes**
   ```bash
   terraform apply tfplan
   ```

### CI/CD Deployment

The GitHub Actions workflow (`terraform.yml`) automates:

1. **Validation**: Format checks and syntax validation
2. **Planning**: Generate and comment plans on PRs
3. **Security Scanning**: Checkov for IaC security
4. **Cost Estimation**: Infracost for cost analysis
5. **Deployment**: Auto-apply on main branch push

**Workflow Triggers:**
- Push to `main` or `develop` with terraform changes
- Pull requests with terraform changes
- Manual workflow dispatch

## Outputs

After deployment, retrieve outputs:

```bash
cd terraform
terraform output alb_dns_name
terraform output cloudfront_domain_name
terraform output rds_endpoint
terraform output ecs_cluster_name
```

Key outputs:
- `alb_dns_name`: Load balancer DNS for direct access
- `cloudfront_domain_name`: CDN domain for cached content
- `rds_endpoint`: Database connection string
- `ecs_cluster_name`: ECS cluster identifier

## State Management

### Viewing State

```bash
terraform state list
terraform state show aws_ecs_service.main
```

### Backing Up State

```bash
terraform state pull > terraform.tfstate.backup
```

### Locking

State is automatically locked during operations. Manual unlock (use with caution):

```bash
terraform force-unlock <LOCK_ID>
```

## Scaling

### Auto-Scaling Configuration

ECS service auto-scales based on:
- **CPU**: Target 70% average utilization
- **Memory**: Target 80% average utilization

Adjust in `main.tf`:

```hcl
target_tracking_scaling_policy_configuration {
  target_value = 70.0  # Adjust CPU threshold
}
```

### Manual Scaling

```bash
terraform apply -var="ecs_desired_count=5" -var-file="staging.tfvars"
```

## Updating Infrastructure

### Adding Resources

1. Add resource definition to `main.tf`
2. Add variables to `variables.tf` if needed
3. Plan and review changes
4. Apply changes

### Modifying Resources

1. Update resource configuration in `main.tf`
2. Run `terraform plan` to preview changes
3. Apply changes with `terraform apply`

### Removing Resources

1. Remove resource from `main.tf`
2. Run `terraform plan` to confirm deletion
3. Apply changes

## Troubleshooting

### State Lock Issues

If Terraform hangs on state lock:

```bash
# View locks
aws dynamodb scan --table-name terraform-locks

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### Provider Issues

Reinitialize providers:

```bash
rm -rf .terraform
terraform init
```

### Plan Differences

If plan shows unexpected changes:

```bash
terraform refresh
terraform plan
```

## Security Best Practices

1. **State File Security**
   - Enable S3 encryption
   - Enable versioning
   - Restrict IAM access
   - Use state locking

2. **Secrets Management**
   - Use AWS Secrets Manager for sensitive data
   - Never commit secrets to version control
   - Rotate credentials regularly

3. **IAM Permissions**
   - Use least privilege principle
   - Create separate roles per environment
   - Audit IAM policies regularly

4. **Network Security**
   - Use security groups to restrict traffic
   - Enable VPC Flow Logs
   - Use private subnets for databases

5. **Encryption**
   - Enable encryption at rest (RDS, S3)
   - Use TLS for data in transit
   - Encrypt EBS volumes

## Cost Optimization

1. **Right-sizing**
   - Monitor resource utilization
   - Adjust instance types based on metrics
   - Use Fargate Spot for non-critical workloads

2. **Reserved Instances**
   - Purchase RIs for predictable workloads
   - Use Savings Plans for compute

3. **Cleanup**
   - Remove unused resources
   - Delete old snapshots
   - Archive old logs

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Automated daily backups (7-day retention)
   - Manual snapshots before major changes

2. **State Backups**
   - S3 versioning enabled
   - Regular exports to version control

### Recovery Procedures

1. **Database Recovery**
   ```bash
   # Restore from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier restored-db \
     --db-snapshot-identifier snapshot-id
   ```

2. **Infrastructure Recovery**
   ```bash
   # Reapply from state
   terraform apply -var-file="prod.tfvars"
   ```

## Monitoring

### CloudWatch Metrics

Monitor key metrics:
- ECS CPU/Memory utilization
- ALB request count and latency
- RDS connections and query performance
- CloudFront cache hit ratio

### Alerts

Set up CloudWatch alarms for:
- High CPU/Memory usage
- Database connection failures
- ALB unhealthy targets
- RDS storage space

## Maintenance

### Regular Tasks

- **Weekly**: Review CloudWatch metrics
- **Monthly**: Update Terraform and providers
- **Quarterly**: Review and optimize costs
- **Annually**: Disaster recovery drill

### Updates

Update Terraform version:

```bash
terraform version
# Update to latest
brew upgrade terraform
```

Update AWS provider:

```bash
terraform init -upgrade
```

## References

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Best Practices](https://docs.aws.amazon.com/general/latest/gr/aws-security-best-practices.html)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices)
