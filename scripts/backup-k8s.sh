#!/bin/bash

set -euo pipefail

# Backup and Recovery Script for Fund-My-Cause
# This script handles automated backups of Kubernetes resources and persistent data

BACKUP_DIR="${BACKUP_DIR:-.backups}"
NAMESPACE="${NAMESPACE:-fund-my-cause}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="fund-my-cause-backup-${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

log_info "Starting backup: ${BACKUP_NAME}"

# Backup Kubernetes resources
log_info "Backing up Kubernetes resources..."
kubectl get all -n "${NAMESPACE}" -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/kubernetes-resources.yaml"
kubectl get configmap -n "${NAMESPACE}" -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/configmaps.yaml"
kubectl get secrets -n "${NAMESPACE}" -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/secrets.yaml"
kubectl get pvc -n "${NAMESPACE}" -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/pvcs.yaml"

# Backup Prometheus data
log_info "Backing up Prometheus data..."
PROMETHEUS_POD=$(kubectl get pod -n "${NAMESPACE}" -l app=prometheus -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "${PROMETHEUS_POD}" ]; then
    kubectl exec -n "${NAMESPACE}" "${PROMETHEUS_POD}" -- tar czf - /prometheus | gzip > "${BACKUP_DIR}/${BACKUP_NAME}/prometheus-data.tar.gz"
    log_info "Prometheus data backed up"
else
    log_warn "Prometheus pod not found, skipping Prometheus backup"
fi

# Backup Grafana data
log_info "Backing up Grafana data..."
GRAFANA_POD=$(kubectl get pod -n "${NAMESPACE}" -l app=grafana -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "${GRAFANA_POD}" ]; then
    kubectl exec -n "${NAMESPACE}" "${GRAFANA_POD}" -- tar czf - /var/lib/grafana | gzip > "${BACKUP_DIR}/${BACKUP_NAME}/grafana-data.tar.gz"
    log_info "Grafana data backed up"
else
    log_warn "Grafana pod not found, skipping Grafana backup"
fi

# Create backup metadata
cat > "${BACKUP_DIR}/${BACKUP_NAME}/backup-metadata.json" <<EOF
{
  "backup_name": "${BACKUP_NAME}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "namespace": "${NAMESPACE}",
  "kubernetes_version": "$(kubectl version --short 2>/dev/null | grep Server || echo 'unknown')",
  "backup_size": "$(du -sh ${BACKUP_DIR}/${BACKUP_NAME} | cut -f1)"
}
EOF

log_info "Backup metadata created"

# Compress backup
log_info "Compressing backup..."
cd "${BACKUP_DIR}"
tar czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"
log_info "Backup compressed: ${BACKUP_NAME}.tar.gz"

# Cleanup old backups
log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "fund-my-cause-backup-*.tar.gz" -mtime +${RETENTION_DAYS} -delete
log_info "Cleanup completed"

log_info "Backup completed successfully!"
log_info "Backup location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
