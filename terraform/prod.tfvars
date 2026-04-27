environment = "production"
aws_region  = "us-east-1"

ecs_task_cpu     = 1024
ecs_task_memory  = 2048
ecs_desired_count = 3
ecs_min_capacity = 3
ecs_max_capacity = 10

rds_instance_class       = "db.t3.medium"
rds_allocated_storage    = 100
rds_backup_retention_days = 30

log_retention_days = 90
