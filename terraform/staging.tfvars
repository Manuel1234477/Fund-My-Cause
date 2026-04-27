environment = "staging"
aws_region  = "us-east-1"

ecs_task_cpu     = 512
ecs_task_memory  = 1024
ecs_desired_count = 2
ecs_min_capacity = 2
ecs_max_capacity = 5

rds_instance_class       = "db.t3.small"
rds_allocated_storage    = 50
rds_backup_retention_days = 14

log_retention_days = 30
