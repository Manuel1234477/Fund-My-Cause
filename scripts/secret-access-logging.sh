#!/usr/bin/env bash
# Secret access logging and monitoring script
# Tracks all secret access attempts and generates audit reports
# Usage: ./scripts/secret-access-logging.sh [--report] [--monitor] [--export-csv]

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AUDIT_LOG_DIR="${AUDIT_LOG_DIR:-.secrets/audit}"
VAULT_ADDR="${VAULT_ADDR:-https://vault.local:8200}"
REPORT_MODE=false
MONITOR_MODE=false
EXPORT_CSV=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --report)
      REPORT_MODE=true
      shift
      ;;
    --monitor)
      MONITOR_MODE=true
      shift
      ;;
    --export-csv)
      EXPORT_CSV=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--report] [--monitor] [--export-csv]"
      echo ""
      echo "Options:"
      echo "  --report      Generate access report"
      echo "  --monitor     Monitor real-time access"
      echo "  --export-csv  Export logs to CSV format"
      echo "  --help        Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Ensure audit directory exists
mkdir -p "$AUDIT_LOG_DIR"

log_access() {
  local secret_path=$1
  local action=$2
  local user=$3
  local status=$4
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local log_file="$AUDIT_LOG_DIR/access.log"
  
  echo "$timestamp | $secret_path | $action | $user | $status" >> "$log_file"
}

generate_report() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Secret Access Audit Report${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  local log_file="$AUDIT_LOG_DIR/access.log"
  
  if [ ! -f "$log_file" ]; then
    echo -e "${YELLOW}No access logs found${NC}"
    return
  fi
  
  echo "Total Access Events: $(wc -l < "$log_file")"
  echo ""
  
  echo -e "${BLUE}Access by Secret:${NC}"
  echo ""
  cut -d'|' -f2 "$log_file" | sort | uniq -c | sort -rn | while read count secret; do
    echo "  $secret: $count accesses"
  done
  echo ""
  
  echo -e "${BLUE}Access by User:${NC}"
  echo ""
  cut -d'|' -f4 "$log_file" | sort | uniq -c | sort -rn | while read count user; do
    echo "  $user: $count accesses"
  done
  echo ""
  
  echo -e "${BLUE}Access by Action:${NC}"
  echo ""
  cut -d'|' -f3 "$log_file" | sort | uniq -c | sort -rn | while read count action; do
    echo "  $action: $count times"
  done
  echo ""
  
  echo -e "${BLUE}Failed Access Attempts:${NC}"
  echo ""
  grep "FAILED" "$log_file" | tail -10 | while read line; do
    echo "  $line"
  done
  echo ""
  
  echo -e "${BLUE}Recent Access (Last 10):${NC}"
  echo ""
  tail -10 "$log_file" | while read line; do
    echo "  $line"
  done
  echo ""
}

monitor_access() {
  echo -e "${BLUE}Monitoring secret access (Ctrl+C to stop)...${NC}"
  echo ""
  
  local log_file="$AUDIT_LOG_DIR/access.log"
  
  if [ ! -f "$log_file" ]; then
    touch "$log_file"
  fi
  
  tail -f "$log_file" | while read line; do
    if echo "$line" | grep -q "FAILED"; then
      echo -e "${RED}✗ $line${NC}"
    elif echo "$line" | grep -q "SUCCESS"; then
      echo -e "${GREEN}✓ $line${NC}"
    else
      echo "$line"
    fi
  done
}

export_csv() {
  local log_file="$AUDIT_LOG_DIR/access.log"
  local csv_file="$AUDIT_LOG_DIR/access_report_$(date +%Y%m%d_%H%M%S).csv"
  
  if [ ! -f "$log_file" ]; then
    echo -e "${YELLOW}No access logs found${NC}"
    return
  fi
  
  {
    echo "Timestamp,Secret Path,Action,User,Status"
    sed 's/ | /,/g' "$log_file"
  } > "$csv_file"
  
  echo -e "${GREEN}✓ CSV report exported to: $csv_file${NC}"
}

fetch_vault_audit_logs() {
  echo -e "${BLUE}Fetching Vault audit logs...${NC}"
  
  if [ -z "${VAULT_TOKEN:-}" ]; then
    echo -e "${RED}✗ VAULT_TOKEN not set${NC}"
    return 1
  fi
  
  local audit_file="$AUDIT_LOG_DIR/vault_audit_$(date +%Y%m%d_%H%M%S).json"
  
  curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
    "$VAULT_ADDR/v1/sys/audit" | jq '.' > "$audit_file"
  
  echo -e "${GREEN}✓ Vault audit logs saved to: $audit_file${NC}"
}

fetch_aws_cloudtrail_logs() {
  echo -e "${BLUE}Fetching AWS CloudTrail logs...${NC}"
  
  local trail_name="fund-my-cause-secrets-trail"
  local log_file="$AUDIT_LOG_DIR/cloudtrail_$(date +%Y%m%d_%H%M%S).json"
  
  aws cloudtrail lookup-events \
    --trail-name "$trail_name" \
    --max-results 50 \
    --query 'Events[?EventName==`GetSecretValue` || EventName==`PutSecretValue`]' \
    > "$log_file" 2>/dev/null || {
    echo -e "${YELLOW}⊘ AWS CloudTrail not configured${NC}"
    return 1
  }
  
  echo -e "${GREEN}✓ CloudTrail logs saved to: $log_file${NC}"
}

analyze_suspicious_activity() {
  echo -e "${BLUE}Analyzing for suspicious activity...${NC}"
  echo ""
  
  local log_file="$AUDIT_LOG_DIR/access.log"
  
  if [ ! -f "$log_file" ]; then
    echo -e "${YELLOW}No access logs found${NC}"
    return
  fi
  
  # Check for multiple failed attempts
  local failed_attempts=$(grep "FAILED" "$log_file" | wc -l)
  if [ "$failed_attempts" -gt 5 ]; then
    echo -e "${RED}⚠ High number of failed access attempts: $failed_attempts${NC}"
  fi
  
  # Check for access outside business hours
  echo -e "${BLUE}Access outside business hours (22:00-06:00 UTC):${NC}"
  grep -E "T(2[2-9]|0[0-5]):" "$log_file" | head -5 || echo "  None detected"
  echo ""
  
  # Check for unusual access patterns
  echo -e "${BLUE}Unusual access patterns:${NC}"
  cut -d'|' -f4 "$log_file" | sort | uniq -c | sort -rn | awk '$1 > 10 {print "  User " $2 " accessed secrets " $1 " times"}' || echo "  None detected"
  echo ""
}

main() {
  if [ "$REPORT_MODE" = true ]; then
    generate_report
  elif [ "$MONITOR_MODE" = true ]; then
    monitor_access
  elif [ "$EXPORT_CSV" = true ]; then
    export_csv
  else
    echo -e "${BLUE}Secret Access Logging${NC}"
    echo ""
    echo "Fetching audit logs from configured backends..."
    echo ""
    
    fetch_vault_audit_logs || true
    fetch_aws_cloudtrail_logs || true
    
    echo ""
    analyze_suspicious_activity
  fi
}

main
