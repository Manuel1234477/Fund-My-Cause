# Backup and Disaster Recovery

## Overview

This document outlines backup and disaster recovery procedures for Fund-My-Cause infrastructure.

## Backup Strategy

### Automated Backups
- **Frequency**: Daily at 2 AM UTC
- **Retention**: 30 days
- **Storage**: Persistent Volume (100Gi)
- **Components**: Kubernetes resources, ConfigMaps, Secrets, Prometheus data, Grafana data

### Manual Backups
Run the backup script manually:

```bash
./scripts/backup-k8s.sh
```

Environment variables:
- `BACKUP_DIR`: Backup directory (default: `.backups`)
- `NAMESPACE`: Kubernetes namespace (default: `fund-my-cause`)
- `RETENTION_DAYS`: Retention period (default: `30`)

## Backup Contents

Each backup includes:
- `kubernetes-resources.yaml` - All Kubernetes resources (pods, deployments, etc.)
- `configmaps.yaml` - ConfigMap objects
- `secrets.yaml` - Secret objects
- `pvcs.yaml` - PersistentVolumeClaim definitions
- `prometheus-data.tar.gz` - Prometheus time-series database
- `grafana-data.tar.gz` - Grafana dashboards and datasources
- `backup-metadata.json` - Backup metadata and timestamp

## Recovery Procedures

### Full Recovery

1. Verify backup file:
```bash
ls -lh .backups/fund-my-cause-backup-*.tar.gz
```

2. Run recovery script:
```bash
./scripts/restore-k8s.sh .backups/fund-my-cause-backup-YYYYMMDD_HHMMSS.tar.gz
```

3. Verify recovery:
```bash
kubectl get all -n fund-my-cause
kubectl get configmap -n fund-my-cause
kubectl get secrets -n fund-my-cause
```

### Partial Recovery

To restore specific components:

1. Extract backup:
```bash
tar xzf fund-my-cause-backup-YYYYMMDD_HHMMSS.tar.gz
cd fund-my-cause-backup-YYYYMMDD_HHMMSS
```

2. Restore specific resource:
```bash
kubectl apply -f configmaps.yaml -n fund-my-cause
```

### Prometheus Data Recovery

If only Prometheus data needs recovery:

```bash
# Extract backup
tar xzf fund-my-cause-backup-YYYYMMDD_HHMMSS.tar.gz
cd fund-my-cause-backup-YYYYMMDD_HHMMSS

# Get Prometheus pod
PROMETHEUS_POD=$(kubectl get pod -n fund-my-cause -l app=prometheus -o jsonpath='{.items[0].metadata.name}')

# Restore data
kubectl exec -n fund-my-cause ${PROMETHEUS_POD} -- rm -rf /prometheus/*
cat prometheus-data.tar.gz | kubectl exec -n fund-my-cause ${PROMETHEUS_POD} -- tar xzf - -C /
```

### Grafana Data Recovery

If only Grafana data needs recovery:

```bash
# Extract backup
tar xzf fund-my-cause-backup-YYYYMMDD_HHMMSS.tar.gz
cd fund-my-cause-backup-YYYYMMDD_HHMMSS

# Get Grafana pod
GRAFANA_POD=$(kubectl get pod -n fund-my-cause -l app=grafana -o jsonpath='{.items[0].metadata.name}')

# Restore data
kubectl exec -n fund-my-cause ${GRAFANA_POD} -- rm -rf /var/lib/grafana/*
cat grafana-data.tar.gz | kubectl exec -n fund-my-cause ${GRAFANA_POD} -- tar xzf - -C /
```

## Disaster Recovery Testing

### Monthly Test Procedure

1. Create test namespace:
```bash
kubectl create namespace fund-my-cause-test
```

2. Restore to test namespace:
```bash
./scripts/restore-k8s.sh .backups/fund-my-cause-backup-YYYYMMDD_HHMMSS.tar.gz
# When prompted, use: fund-my-cause-test
```

3. Verify all services are running:
```bash
kubectl get all -n fund-my-cause-test
kubectl logs -n fund-my-cause-test -l app=fund-my-cause-frontend
```

4. Cleanup test namespace:
```bash
kubectl delete namespace fund-my-cause-test
```

## Backup Verification

Check backup integrity:

```bash
# List backups
ls -lh .backups/fund-my-cause-backup-*.tar.gz

# Verify backup contents
tar tzf fund-my-cause-backup-YYYYMMDD_HHMMSS.tar.gz | head -20

# Check backup metadata
tar xzOf fund-my-cause-backup-YYYYMMDD_HHMMSS.tar.gz \
  fund-my-cause-backup-YYYYMMDD_HHMMSS/backup-metadata.json | jq '.'
```

## Off-site Backup

For production environments, backup to external storage:

```bash
# Upload to S3
aws s3 cp .backups/fund-my-cause-backup-YYYYMMDD_HHMMSS.tar.gz \
  s3://backup-bucket/fund-my-cause/

# Upload to GCS
gsutil cp .backups/fund-my-cause-backup-YYYYMMDD_HHMMSS.tar.gz \
  gs://backup-bucket/fund-my-cause/
```

## RTO and RPO

- **Recovery Time Objective (RTO)**: 1 hour
- **Recovery Point Objective (RPO)**: 24 hours (daily backups)

## Backup Monitoring

Monitor backup job status:

```bash
# Check CronJob
kubectl get cronjob -n fund-my-cause

# Check recent backup jobs
kubectl get jobs -n fund-my-cause -l job-type=backup

# View backup job logs
kubectl logs -n fund-my-cause -l job-type=backup --tail=100
```

## Troubleshooting

### Backup fails due to insufficient storage
```bash
# Check PVC usage
kubectl exec -n fund-my-cause backup-pod -- df -h /backups

# Increase PVC size
kubectl patch pvc backup-pvc -n fund-my-cause -p '{"spec":{"resources":{"requests":{"storage":"200Gi"}}}}'
```

### Recovery fails with permission errors
```bash
# Verify ServiceAccount permissions
kubectl get rolebinding,clusterrolebinding -n fund-my-cause | grep backup

# Check pod logs
kubectl logs -n fund-my-cause <pod-name>
```

### Corrupted backup file
```bash
# Verify backup integrity
tar tzf fund-my-cause-backup-YYYYMMDD_HHMMSS.tar.gz > /dev/null

# Use previous backup
./scripts/restore-k8s.sh .backups/fund-my-cause-backup-PREVIOUS_DATE.tar.gz
```
