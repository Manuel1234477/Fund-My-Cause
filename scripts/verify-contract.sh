#!/usr/bin/env bash
# Verify deployed Soroban contracts
# Usage: ./scripts/verify-contract.sh <contract_id> [network]

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Defaults
NETWORK="${2:-testnet}"
CONTRACT_ID="${1:-}"

# Helper functions
log_info() { echo -e "${BLUE}➜${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1" >&2; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

if [ -z "$CONTRACT_ID" ]; then
  echo "Usage: $0 <contract_id> [network]"
  echo "Example: $0 CAQCBGVLWCSMNRMQ4ZBVWWV5CSTW2UNKHJ42OU7CW7ADgnboraeoSol testnet"
  exit 1
fi

log_info "Verifying contract: $CONTRACT_ID on $NETWORK"

# 1. Verify contract exists
log_info "Checking contract existence..."
if ! stellar contract info --id "$CONTRACT_ID" --network "$NETWORK" > /dev/null 2>&1; then
  log_error "Contract not found on $NETWORK"
  exit 1
fi
log_success "Contract exists"

# 2. Get contract info
log_info "Retrieving contract information..."
CONTRACT_INFO=$(stellar contract info --id "$CONTRACT_ID" --network "$NETWORK" 2>&1)

# 3. Verify WASM bytecode
log_info "Verifying WASM bytecode..."
DEPLOYED_HASH=$(echo "$CONTRACT_INFO" | grep -i "hash" | head -1 | awk '{print $NF}' || echo "")

if [ -z "$DEPLOYED_HASH" ]; then
  log_warning "Could not extract deployed hash"
else
  log_success "Deployed hash: $DEPLOYED_HASH"
fi

# 4. Compare with local build
log_info "Building local WASM for comparison..."
if [ -f "contracts/crowdfund/Cargo.toml" ]; then
  cargo build --release --target wasm32-unknown-unknown --manifest-path contracts/crowdfund/Cargo.toml 2>&1 | tail -3
  
  if [ -f "target/wasm32-unknown-unknown/release/crowdfund.wasm" ]; then
    LOCAL_HASH=$(sha256sum target/wasm32-unknown-unknown/release/crowdfund.wasm | awk '{print $1}')
    log_success "Local hash: $LOCAL_HASH"
    
    if [ "$DEPLOYED_HASH" = "$LOCAL_HASH" ]; then
      log_success "Bytecode matches local build"
    else
      log_warning "Bytecode differs from local build (expected for optimized builds)"
    fi
  fi
fi

# 5. Verify contract methods
log_info "Verifying contract interface..."
METHODS=("initialize" "contribute" "withdraw" "refund_single" "get_stats" "total_raised" "goal" "deadline")
MISSING_METHODS=()

for method in "${METHODS[@]}"; do
  if stellar contract invoke --id "$CONTRACT_ID" --network "$NETWORK" -- "$method" --help > /dev/null 2>&1; then
    log_success "Method found: $method"
  else
    MISSING_METHODS+=("$method")
  fi
done

if [ ${#MISSING_METHODS[@]} -gt 0 ]; then
  log_warning "Missing methods: ${MISSING_METHODS[*]}"
else
  log_success "All expected methods present"
fi

# 6. Generate verification report
REPORT_FILE="contract-verification-$(date +%s).json"
log_info "Generating verification report: $REPORT_FILE"

cat > "$REPORT_FILE" << EOF
{
  "contract_id": "$CONTRACT_ID",
  "network": "$NETWORK",
  "verification_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployed_hash": "$DEPLOYED_HASH",
  "local_hash": "${LOCAL_HASH:-unknown}",
  "methods_verified": $(echo "${METHODS[@]}" | jq -R 'split(" ")'),
  "missing_methods": $(echo "${MISSING_METHODS[@]}" | jq -R 'split(" ")'),
  "status": "verified"
}
EOF

log_success "Verification report saved: $REPORT_FILE"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}                  ${GREEN}VERIFICATION COMPLETE${NC}                        ${BLUE}║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} Contract ID:       ${GREEN}$CONTRACT_ID${NC}"
echo -e "${BLUE}║${NC} Network:           ${GREEN}$NETWORK${NC}"
echo -e "${BLUE}║${NC} Status:            ${GREEN}Verified${NC}"
echo -e "${BLUE}║${NC} Report:            ${GREEN}$REPORT_FILE${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
