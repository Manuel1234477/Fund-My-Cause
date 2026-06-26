#!/usr/bin/env bash
# Secret management tests
# Validates secret vault setup and rotation procedures

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
  local test_name=$1
  local result=$2
  
  if [ "$result" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $test_name"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗${NC} $test_name"
    ((TESTS_FAILED++))
  fi
}

# Test 1: Rotation script exists and is executable
test_rotation_script() {
  [ -x "./scripts/rotate-secrets.sh" ]
}

# Test 2: Rotation script has dry-run capability
test_rotation_dry_run() {
  ./scripts/rotate-secrets.sh --dry-run > /dev/null 2>&1
}

# Test 3: Secret access logging script exists
test_logging_script() {
  [ -x "./scripts/secret-access-logging.sh" ]
}

# Test 4: Audit directory can be created
test_audit_directory() {
  mkdir -p .secrets/audit
  [ -d ".secrets/audit" ]
}

# Test 5: Rotation log can be created
test_rotation_log() {
  mkdir -p .secrets
  touch .secrets/rotation.log
  [ -f ".secrets/rotation.log" ]
}

# Test 6: Secret vault documentation exists
test_vault_docs() {
  [ -f "./docs/secret-vault-setup.md" ]
}

# Test 7: Secret management documentation exists
test_secret_mgmt_docs() {
  [ -f "./docs/secret-management.md" ]
}

# Test 8: GitHub Actions secret rotation workflow exists
test_secret_rotation_workflow() {
  [ -f "./.github/workflows/secret-rotation.yml" ]
}

# Test 9: Rotation script handles force flag
test_rotation_force_flag() {
  ./scripts/rotate-secrets.sh --force > /dev/null 2>&1
}

# Test 10: Logging script can generate report
test_logging_report() {
  ./scripts/secret-access-logging.sh --report > /dev/null 2>&1
}

main() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Secret Management Tests${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  test_result "Rotation script exists" $(test_rotation_script && echo 0 || echo 1)
  test_result "Rotation script has dry-run" $(test_rotation_dry_run && echo 0 || echo 1)
  test_result "Logging script exists" $(test_logging_script && echo 0 || echo 1)
  test_result "Audit directory creation" $(test_audit_directory && echo 0 || echo 1)
  test_result "Rotation log creation" $(test_rotation_log && echo 0 || echo 1)
  test_result "Vault setup documentation" $(test_vault_docs && echo 0 || echo 1)
  test_result "Secret management documentation" $(test_secret_mgmt_docs && echo 0 || echo 1)
  test_result "Secret rotation workflow" $(test_secret_rotation_workflow && echo 0 || echo 1)
  test_result "Rotation force flag support" $(test_rotation_force_flag && echo 0 || echo 1)
  test_result "Logging report generation" $(test_logging_report && echo 0 || echo 1)
  
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
  echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  
  if [ "$TESTS_FAILED" -gt 0 ]; then
    exit 1
  fi
}

main
