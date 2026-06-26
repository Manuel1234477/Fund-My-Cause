#!/bin/bash

set -euo pipefail

# Recovery Script for Fund-My-Cause
# This script restores Kubernetes resources and persistent data from backups

BACKUP_FILE="${1:?Backup file required. Usage: $0 <backup-file.tar.gz>}"
NAMESPACE="${NAMESPACE:-fund-my-cause}"
RESTORE_DIR=".restore-temp"

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

# Verify backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    log_error "Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

log_info "Starting recovery from: ${BACKUP_FILE}"

# Extract backup
log_info "Extracting backup..."
mkdir -p "${RESTORE_DIR}"
tar xzf "${BACKUP_FILE}" -C "${RESTORE_DIR}"

# Find the backup directory
BACKUP_DIR=$(find "${RESTORE_DIR}" -maxdepth 1 -type d -name "fund-my-cause-backup-*" | head -1)
if [ -z "${BACKUP_DIR}" ]; then
    log_error "Invalid backup file format"
    rm -rf "${RESTORE_DIR}"
    exit 1
fi

log_info "Backup metadata:"
cat "${BACKUP_DIR}/backup-metadata.json" | jq '.'

# Confirm recovery
read -p "Proceed with recovery to namespace '${NAMESPACE}'? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_warn "Recovery cancelled"
    rm -rf "${RESTORE_DIR}"
    exit 0
fi

# Restore Kubernetes resources
log_info "Restoring Kubernetes resources..."
if [ -f "${BACKUP_DIR}/kubernetes-resources.yaml" ]; then
    kubectl apply -f "${BACKUP_DIR}/kubernetes-resources.yaml" -n "${NAMESPACE}"
    log_info "Kubernetes resources restored"
fi

# Restore ConfigMaps
log_info "Restoring ConfigMaps..."
if [ -f "${BACKUP_DIR}/configmaps.yaml" ]; then
    kubectl apply -f "${BACKUP_DIR}/configmaps.yaml" -n "${NAMESPACE}"
    log_info "ConfigMaps restored"
fi

# Restore Secrets
log_info "Restoring Secrets..."
if [ -f "${BACKUP_DIR}/secrets.yaml" ]; then
    kubectl apply -f "${BACKUP_DIR}/secrets.yaml" -n "${NAMESPACE}"
    log_info "Secrets restored"
fi

# Restore PVCs
log_info "Restoring PersistentVolumeClaims..."
if [ -f "${BACKUP_DIR}/pvcs.yaml" ]; then
    kubectl apply -f "${BACKUP_DIR}/pvcs.yaml" -n "${NAMESPACE}"
    log_info "PVCs restored"
fi

# Restore Prometheus data
log_info "Restoring Prometheus data..."
if [ -f "${BACKUP_DIR}/prometheus-data.tar.gz" ]; then
    PROMETHEUS_POD=$(kubectl get pod -n "${NAMESPACE}" -l app=prometheus -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -n "${PROMETHEUS_POD}" ]; then
        kubectl exec -n "${NAMESPACE}" "${PROMETHEUS_POD}" -- rm -rf /prometheus/*
        cat "${BACKUP_DIR}/prometheus-data.tar.gz" | kubectl exec -n "${NAMESPACE}" "${PROMETHEUS_POD}" -- tar xzf - -C /
        log_info "Prometheus data restored"
    else
        log_warn "Prometheus pod not found, skipping Prometheus restore"
    fi
fi

# Restore Grafana data
log_info "Restoring Grafana data..."
if [ -f "${BACKUP_DIR}/grafana-data.tar.gz" ]; then
    GRAFANA_POD=$(kubectl get pod -n "${NAMESPACE}" -l app=grafana -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -n "${GRAFANA_POD}" ]; then
        kubectl exec -n "${NAMESPACE}" "${GRAFANA_POD}" -- rm -rf /var/lib/grafana/*
        cat "${BACKUP_DIR}/grafana-data.tar.gz" | kubectl exec -n "${NAMESPACE}" "${GRAFANA_POD}" -- tar xzf - -C /
        log_info "Grafana data restored"
    else
        log_warn "Grafana pod not found, skipping Grafana restore"
    fi
fi

# Cleanup
rm -rf "${RESTORE_DIR}"

log_info "Recovery completed successfully!"
log_info "Verify the restored resources with: kubectl get all -n ${NAMESPACE}"
