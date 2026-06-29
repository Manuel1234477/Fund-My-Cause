#!/usr/bin/env bash
# Frontend canary deployment helper
# Usage:
#   ./scripts/canary-frontend.sh wait_ready <port>
#   ./scripts/canary-frontend.sh smoke_test <port>
#   ./scripts/canary-frontend.sh monitor --port <p> --duration <s> --interval <s> --error-threshold <n>
#   ./scripts/canary-frontend.sh promote --stable-port <p> --canary-port <p> --image-tag <tag>
#   ./scripts/canary-frontend.sh rollback --canary-port <p>

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}➜${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_error()   { echo -e "${RED}✗${NC} $1" >&2; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

COMMAND="${1:-}"
shift || true

# ─────────────────────────────────────────
# wait_ready <port>
# Polls until the instance on <port> responds HTTP 200
# ─────────────────────────────────────────
cmd_wait_ready() {
  local port="${1:?port required}"
  local max_attempts=30
  local attempt=0

  log_info "Waiting for canary instance on port ${port}..."
  while [ "${attempt}" -lt "${max_attempts}" ]; do
    if curl -sf "http://localhost:${port}/" > /dev/null 2>&1; then
      log_success "Canary ready on port ${port}"
      return 0
    fi
    attempt=$((attempt + 1))
    echo "  Waiting... (${attempt}/${max_attempts})"
    sleep 2
  done

  log_error "Canary on port ${port} did not become ready in time"
  exit 1
}

# ─────────────────────────────────────────
# smoke_test <port>
# Validates key pages return expected status codes
# ─────────────────────────────────────────
cmd_smoke_test() {
  local port="${1:?port required}"
  local failures=0

  log_info "Running smoke tests against http://localhost:${port}"

  declare -A CHECKS=(
    ["/"]="200"
    ["/campaigns"]="200"
  )

  for path in "${!CHECKS[@]}"; do
    expected="${CHECKS[$path]}"
    actual=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "http://localhost:${port}${path}" || echo "000")
    if [ "${actual}" = "${expected}" ]; then
      log_success "  GET ${path} → ${actual}"
    else
      log_error "  GET ${path} → ${actual} (expected ${expected})"
      failures=$((failures + 1))
    fi
  done

  if [ "${failures}" -gt 0 ]; then
    log_error "${failures} smoke test(s) failed"
    exit 1
  fi

  log_success "All smoke tests passed"
}

# ─────────────────────────────────────────
# monitor --port --duration --interval --error-threshold
# Polls the canary instance and tracks the error rate.
# Outputs rollback=true to GITHUB_OUTPUT if the error rate exceeds the threshold.
# ─────────────────────────────────────────
cmd_monitor() {
  local port=3001
  local duration=120
  local interval=15
  local error_threshold=5

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --port)            port="$2";            shift 2 ;;
      --duration)        duration="$2";        shift 2 ;;
      --interval)        interval="$2";        shift 2 ;;
      --error-threshold) error_threshold="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

  local total_checks=0
  local error_checks=0
  local elapsed=0

  log_info "Monitoring canary on port ${port} for ${duration}s (interval: ${interval}s, error threshold: ${error_threshold}%)"

  while [ "${elapsed}" -lt "${duration}" ]; do
    http_code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "http://localhost:${port}/" || echo "000")
    total_checks=$((total_checks + 1))

    if ! echo "${http_code}" | grep -qE '^2'; then
      error_checks=$((error_checks + 1))
      log_warning "  Error response: ${http_code} (errors: ${error_checks}/${total_checks})"
    else
      echo "  OK: ${http_code} (errors: ${error_checks}/${total_checks})"
    fi

    # Compute error rate (integer percent)
    if [ "${total_checks}" -gt 0 ]; then
      error_rate=$(( (error_checks * 100) / total_checks ))
    else
      error_rate=0
    fi

    if [ "${error_rate}" -gt "${error_threshold}" ]; then
      log_error "Error rate ${error_rate}% exceeds threshold ${error_threshold}% — triggering rollback"
      echo "rollback=true" >> "${GITHUB_OUTPUT:-/dev/null}"
      echo "error_rate=${error_rate}" >> "${GITHUB_OUTPUT:-/dev/null}"
      exit 1
    fi

    sleep "${interval}"
    elapsed=$((elapsed + interval))
  done

  log_success "Observation window complete. Error rate: ${error_rate}% (threshold: ${error_threshold}%)"
  echo "rollback=false" >> "${GITHUB_OUTPUT:-/dev/null}"
  echo "error_rate=${error_rate}" >> "${GITHUB_OUTPUT:-/dev/null}"
}

# ─────────────────────────────────────────
# promote --stable-port --canary-port --image-tag
# Stops the stable instance and promotes canary to stable.
# ─────────────────────────────────────────
cmd_promote() {
  local stable_port=3000
  local canary_port=3001
  local image_tag=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --stable-port) stable_port="$2"; shift 2 ;;
      --canary-port) canary_port="$2"; shift 2 ;;
      --image-tag)   image_tag="$2";   shift 2 ;;
      *) shift ;;
    esac
  done

  log_info "Promoting canary (port ${canary_port}) to stable (port ${stable_port})"

  # Stop old stable
  docker stop fmc-stable 2>/dev/null || true
  docker rm   fmc-stable 2>/dev/null || true

  # Rename canary to stable and re-expose on stable port
  docker stop fmc-canary 2>/dev/null || true
  docker rm   fmc-canary 2>/dev/null || true

  if [ -n "${image_tag}" ]; then
    docker run -d \
      --name fmc-stable \
      -p "${stable_port}:3000" \
      --env-file apps/interface/.env.example \
      "fund-my-cause-frontend:${image_tag}"
  fi

  log_success "Canary promoted. New stable is serving on port ${stable_port}"
}

# ─────────────────────────────────────────
# rollback --canary-port
# Stops the canary instance, leaving the stable untouched.
# ─────────────────────────────────────────
cmd_rollback() {
  local canary_port=3001

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --canary-port) canary_port="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

  log_warning "Rolling back canary on port ${canary_port}"
  docker stop fmc-canary 2>/dev/null || true
  docker rm   fmc-canary 2>/dev/null || true
  log_success "Canary stopped. Stable instance continues serving traffic"
}

# ─────────────────────────────────────────
# Dispatch
# ─────────────────────────────────────────
case "${COMMAND}" in
  wait_ready)  cmd_wait_ready "$@" ;;
  smoke_test)  cmd_smoke_test "$@" ;;
  monitor)     cmd_monitor "$@" ;;
  promote)     cmd_promote "$@" ;;
  rollback)    cmd_rollback "$@" ;;
  *)
    echo "Usage: $0 <wait_ready|smoke_test|monitor|promote|rollback> [options]"
    exit 1
    ;;
esac
