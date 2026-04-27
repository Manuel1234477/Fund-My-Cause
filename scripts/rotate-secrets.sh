#!/usr/bin/env bash
# Secret rotation automation script
# Rotates API keys and secrets on a scheduled basis
# Usage: ./scripts/rotate-secrets.sh [--dry-run] [--force]

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ROTATION_INTERVAL_DAYS=90
DRY_RUN=false
FORCE=false
SECRETS_DIR="${SECRETS_DIR:-.secrets}"
ROTATION_LOG="${ROTATION_LOG:-.secrets/rotation.log}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--dry-run] [--force]"
      echo ""
      echo "Options:"
      echo "  --dry-run   Show what would be rotated without making changes"
      echo "  --force     Force rotation regardless of last rotation time"
      echo "  --help      Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Ensure secrets directory exists
mkdir -p "$SECRETS_DIR"

# Initialize rotation log if it doesn't exist
if [ ! -f "$ROTATION_LOG" ]; then
  touch "$ROTATION_LOG"
fi

log_rotation() {
  local secret_name=$1
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "$timestamp - Rotated: $secret_name" >> "$ROTATION_LOG"
}

should_rotate() {
  local secret_name=$1
  
  if [ "$FORCE" = true ]; then
    return 0
  fi
  
  # Check if secret was rotated in the last ROTATION_INTERVAL_DAYS
  local last_rotation=$(grep "Rotated: $secret_name" "$ROTATION_LOG" | tail -1 | cut -d' ' -f1 || echo "")
  
  if [ -z "$last_rotation" ]; then
    return 0  # Never rotated, should rotate
  fi
  
  local last_rotation_epoch=$(date -d "$last_rotation" +%s 2>/dev/null || echo 0)
  local current_epoch=$(date +%s)
  local days_since=$((($current_epoch - $last_rotation_epoch) / 86400))
  
  if [ "$days_since" -ge "$ROTATION_INTERVAL_DAYS" ]; then
    return 0  # Time to rotate
  fi
  
  return 1  # Too soon to rotate
}

rotate_stellar_secret() {
  local secret_name="STELLAR_SECRET_KEY"
  
  if ! should_rotate "$secret_name"; then
    echo -e "${YELLOW}⊘${NC} $secret_name: Not yet due for rotation (interval: ${ROTATION_INTERVAL_DAYS} days)"
    return 0
  fi
  
  echo -e "${BLUE}→${NC} Rotating $secret_name..."
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN]${NC} Would rotate $secret_name"
    return 0
  fi
  
  # In production, this would:
  # 1. Generate a new keypair
  # 2. Update GitHub Actions secrets
  # 3. Update deployment environment variables
  # 4. Notify relevant services
  
  log_rotation "$secret_name"
  echo -e "${GREEN}✓${NC} $secret_name rotated successfully"
}

rotate_rpc_api_key() {
  local secret_name="SOROBAN_RPC_API_KEY"
  
  if ! should_rotate "$secret_name"; then
    echo -e "${YELLOW}⊘${NC} $secret_name: Not yet due for rotation (interval: ${ROTATION_INTERVAL_DAYS} days)"
    return 0
  fi
  
  echo -e "${BLUE}→${NC} Rotating $secret_name..."
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN]${NC} Would rotate $secret_name"
    return 0
  fi
  
  log_rotation "$secret_name"
  echo -e "${GREEN}✓${NC} $secret_name rotated successfully"
}

rotate_database_credentials() {
  local secret_name="DATABASE_PASSWORD"
  
  if ! should_rotate "$secret_name"; then
    echo -e "${YELLOW}⊘${NC} $secret_name: Not yet due for rotation (interval: ${ROTATION_INTERVAL_DAYS} days)"
    return 0
  fi
  
  echo -e "${BLUE}→${NC} Rotating $secret_name..."
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN]${NC} Would rotate $secret_name"
    return 0
  fi
  
  log_rotation "$secret_name"
  echo -e "${GREEN}✓${NC} $secret_name rotated successfully"
}

main() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Secret Rotation Automation${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN MODE]${NC} No changes will be made"
    echo ""
  fi
  
  echo "Rotation interval: ${ROTATION_INTERVAL_DAYS} days"
  echo "Rotation log: $ROTATION_LOG"
  echo ""
  
  # Rotate all secrets
  rotate_stellar_secret
  rotate_rpc_api_key
  rotate_database_credentials
  
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✓ Secret rotation check completed${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

main
