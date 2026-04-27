# Infrastructure Testing Configuration
# This file contains validation rules and test configurations for Terraform

# Validate VPC configuration
locals {
  vpc_validation = {
    cidr_valid = can(regex("^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$", var.vpc_cidr))
    az_count   = length(var.availability_zones) >= 2
  }
}

# Validate ECS configuration
locals {
  ecs_validation = {
    cpu_valid    = contains([256, 512, 1024, 2048, 4096], var.ecs_task_cpu)
    memory_valid = contains([512, 1024, 2048, 3072, 4096, 5120, 6144, 7168, 8192], var.ecs_task_memory)
    desired_ge_min = var.ecs_desired_count >= var.ecs_min_capacity
    max_ge_min     = var.ecs_max_capacity >= var.ecs_min_capacity
  }
}

# Validate RDS configuration
locals {
  rds_validation = {
    backup_retention_valid = var.rds_backup_retention_days >= 1 && var.rds_backup_retention_days <= 35
    storage_valid          = var.rds_allocated_storage >= 20 && var.rds_allocated_storage <= 65536
  }
}

# Test: VPC CIDR is valid
check "vpc_cidr_valid" {
  assert {
    condition     = local.vpc_validation.cidr_valid
    error_message = "VPC CIDR must be a valid CIDR block (e.g., 10.0.0.0/16)"
  }
}

# Test: At least 2 availability zones
check "availability_zones_count" {
  assert {
    condition     = local.vpc_validation.az_count
    error_message = "At least 2 availability zones must be specified for high availability"
  }
}

# Test: ECS task CPU is valid
check "ecs_cpu_valid" {
  assert {
    condition     = local.ecs_validation.cpu_valid
    error_message = "ECS task CPU must be one of: 256, 512, 1024, 2048, 4096"
  }
}

# Test: ECS task memory is valid
check "ecs_memory_valid" {
  assert {
    condition     = local.ecs_validation.memory_valid
    error_message = "ECS task memory must be a valid value for the specified CPU"
  }
}

# Test: ECS desired count >= min capacity
check "ecs_desired_ge_min" {
  assert {
    condition     = local.ecs_validation.desired_ge_min
    error_message = "ECS desired count must be >= min capacity"
  }
}

# Test: ECS max capacity >= min capacity
check "ecs_max_ge_min" {
  assert {
    condition     = local.ecs_validation.max_ge_min
    error_message = "ECS max capacity must be >= min capacity"
  }
}

# Test: RDS backup retention is valid
check "rds_backup_retention_valid" {
  assert {
    condition     = local.rds_validation.backup_retention_valid
    error_message = "RDS backup retention must be between 1 and 35 days"
  }
}

# Test: RDS storage is valid
check "rds_storage_valid" {
  assert {
    condition     = local.rds_validation.storage_valid
    error_message = "RDS allocated storage must be between 20 and 65536 GB"
  }
}

# Test: ALB has health check configured
check "alb_health_check" {
  assert {
    condition     = aws_lb_target_group.main.health_check[0].enabled == true
    error_message = "ALB target group must have health checks enabled"
  }
}

# Test: Security groups have egress rules
check "security_group_egress" {
  assert {
    condition     = length(aws_security_group.alb.egress) > 0
    error_message = "Security groups must have egress rules defined"
  }
}

# Test: RDS encryption is enabled
check "rds_encryption" {
  assert {
    condition     = aws_db_instance.main.storage_encrypted == true
    error_message = "RDS storage encryption must be enabled"
  }
}

# Test: S3 versioning is enabled
check "s3_versioning" {
  assert {
    condition     = aws_s3_bucket_versioning.assets.versioning_configuration[0].status == "Enabled"
    error_message = "S3 bucket versioning must be enabled"
  }
}

# Test: CloudFront has HTTPS redirect
check "cloudfront_https" {
  assert {
    condition     = aws_cloudfront_distribution.main.default_cache_behavior[0].viewer_protocol_policy == "redirect-to-https"
    error_message = "CloudFront must redirect HTTP to HTTPS"
  }
}

# Test: Production has multi-AZ RDS
check "production_multi_az" {
  assert {
    condition     = var.environment != "production" || aws_db_instance.main.multi_az == true
    error_message = "Production RDS must have multi-AZ enabled"
  }
}

# Test: Production has deletion protection on ALB
check "production_alb_protection" {
  assert {
    condition     = var.environment != "production" || aws_lb.main.enable_deletion_protection == true
    error_message = "Production ALB must have deletion protection enabled"
  }
}
