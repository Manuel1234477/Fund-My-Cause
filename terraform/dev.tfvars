environment = "development"
aws_region  = "us-east-1"

ecs_task_cpu     = 256
ecs_task_memory  = 512
ecs_desired_count = 1
ecs_min_capacity = 1
ecs_max_capacity = 3

rds_instance_class       = "db.t3.micro"
rds_allocated_storage    = 20
rds_backup_retention_days = 7

log_retention_days = 7
