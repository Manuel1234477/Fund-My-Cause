#!/usr/bin/env bash
# Automated backup script for critical data
# Creates backups of contract state, configuration, and deployment data
# Usage: ./scripts/backup.sh [--restore <backup-id>] [--list]

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${BACKUP_DIR:-.backups}"
BACKUP_RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_ID="backup-$TIMESTAMP"

# Parse arguments
ACTION="create"
RESTORE_ID=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --restore)
      ACTION="restore"
      RESTORE_ID="$2"
      shift 2
      ;;
    --list)
      ACTION="list"
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--restore <backup-id>] [--list]"
      echo ""
      echo "Options:"
      echo "  --restore <id>  Restore from backup ID"
      echo "  --list          List available backups"
      echo "  --help          Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

mkdir -p "$BACKUP_DIR"

# Create backup of critical files
create_backup() {
  echo -e "${BLUE}→${NC} Creating backup: $BACKUP_ID"
  
  local backup_path="$BACKUP_DIR/$BACKUP_ID"
  mkdir -p "$backup_path"
  
  # Backup contract artifacts
  if [ -d "target/wasm32-unknown-unknown/release" ]; then
    echo -e "${BLUE}  →${NC} Backing up contract artifacts..."
    mkdir -p "$backup_path/contracts"
    cp -r target/wasm32-unknown-unknown/release/*.wasm "$backup_path/contracts/" 2>/dev/null || true
  fi
  
  # Backup deployment configuration
  if [ -f "Cargo.lock" ]; then
    echo -e "${BLUE}  →${NC} Backing up Cargo.lock..."
    cp Cargo.lock "$backup_path/"
  fi
  
  # Backup environment configuration
  if [ -f ".env.production" ]; then
    echo -e "${BLUE}  →${NC} Backing up environment config..."
    cp .env.production "$backup_path/.env.production.bak"
  fi
  
  # Backup GitHub Actions secrets (metadata only, not actual values)
  if [ -d ".github/workflows" ]; then
    echo -e "${BLUE}  →${NC} Backing up workflow configurations..."
    mkdir -p "$backup_path/workflows"
    cp .github/workflows/*.yml "$backup_path/workflows/"
  fi
  
  # Backup contract source code
  if [ -d "contracts" ]; then
    echo -e "${BLUE}  →${NC} Backing up contract source..."
    mkdir -p "$backup_path/contracts-src"
    cp -r contracts/*/src "$backup_path/contracts-src/"
  fi
  
  # Create backup metadata
  cat > "$backup_path/metadata.json" << EOF
{
  "backup_id": "$BACKUP_ID",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hostname": "$(hostname)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "backup_size": "$(du -sh "$backup_path" | cut -f1)",
  "retention_days": $BACKUP_RETENTION_DAYS
}
EOF
  
  # Create compressed archive
  echo -e "${BLUE}  →${NC} Creating compressed archive..."
  tar -czf "$backup_path.tar.gz" -C "$BACKUP_DIR" "$BACKUP_ID" 2>/dev/null || true
  
  echo -e "${GREEN}✓${NC} Backup created: $BACKUP_ID"
  echo "  Location: $backup_path"
  echo "  Archive: $backup_path.tar.gz"
}

# List available backups
list_backups() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Available Backups${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
    echo -e "${YELLOW}No backups found${NC}"
    return 0
  fi
  
  echo "| Backup ID | Date | Size | Status |"
  echo "|-----------|------|------|--------|"
  
  for backup in "$BACKUP_DIR"/backup-*; do
    if [ -d "$backup" ]; then
      backup_name=$(basename "$backup")
      if [ -f "$backup/metadata.json" ]; then
        timestamp=$(grep '"timestamp"' "$backup/metadata.json" | cut -d'"' -f4)
        size=$(du -sh "$backup" | cut -f1)
        status="✓ Valid"
      else
        timestamp="unknown"
        size=$(du -sh "$backup" | cut -f1)
        status="⚠ No metadata"
      fi
      echo "| $backup_name | $timestamp | $size | $status |"
    fi
  done
  
  echo ""
}

# Restore from backup
restore_backup() {
  local backup_path="$BACKUP_DIR/$RESTORE_ID"
  
  if [ ! -d "$backup_path" ]; then
    echo -e "${RED}✗${NC} Backup not found: $RESTORE_ID"
    exit 1
  fi
  
  echo -e "${YELLOW}⚠${NC} Restoring from backup: $RESTORE_ID"
  echo -e "${YELLOW}⚠${NC} This will overwrite current files"
  echo ""
  
  # Verify backup integrity
  if [ ! -f "$backup_path/metadata.json" ]; then
    echo -e "${RED}✗${NC} Backup metadata not found. Backup may be corrupted."
    exit 1
  fi
  
  echo "Backup metadata:"
  cat "$backup_path/metadata.json" | grep -E '"timestamp"|"git_commit"|"git_branch"' || true
  echo ""
  
  read -p "Continue with restore? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
  fi
  
  echo -e "${BLUE}→${NC} Restoring backup..."
  
  # Restore contract artifacts
  if [ -d "$backup_path/contracts" ]; then
    echo -e "${BLUE}  →${NC} Restoring contract artifacts..."
    mkdir -p target/wasm32-unknown-unknown/release
    cp "$backup_path/contracts"/*.wasm target/wasm32-unknown-unknown/release/ 2>/dev/null || true
  fi
  
  # Restore Cargo.lock
  if [ -f "$backup_path/Cargo.lock" ]; then
    echo -e "${BLUE}  →${NC} Restoring Cargo.lock..."
    cp "$backup_path/Cargo.lock" .
  fi
  
  # Restore environment config
  if [ -f "$backup_path/.env.production.bak" ]; then
    echo -e "${BLUE}  →${NC} Restoring environment config..."
    cp "$backup_path/.env.production.bak" .env.production
  fi
  
  echo -e "${GREEN}✓${NC} Restore completed"
  echo "  Backup ID: $RESTORE_ID"
  echo "  Restored at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

# Clean up old backups
cleanup_old_backups() {
  echo -e "${BLUE}→${NC} Cleaning up backups older than $BACKUP_RETENTION_DAYS days..."
  
  find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup-*" -mtime +$BACKUP_RETENTION_DAYS | while read backup; do
    echo -e "${YELLOW}  ⊘${NC} Removing old backup: $(basename "$backup")"
    rm -rf "$backup" "$backup.tar.gz"
  done
  
  echo -e "${GREEN}✓${NC} Cleanup completed"
}

main() {
  case "$ACTION" in
    create)
      create_backup
      cleanup_old_backups
      ;;
    restore)
      restore_backup
      ;;
    list)
      list_backups
      ;;
    *)
      echo "Unknown action: $ACTION"
      exit 1
      ;;
  esac
}

main
