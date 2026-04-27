#!/bin/bash
set -e

# Environment Configuration Validator
# Validates required environment variables for each environment

ENVIRONMENT=${1:-development}
ENV_FILE="apps/interface/.env.${ENVIRONMENT}"

echo "🔍 Validating environment: $ENVIRONMENT"
echo "📄 Config file: $ENV_FILE"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Environment file not found: $ENV_FILE"
  exit 1
fi

# Required variables for all environments
REQUIRED_VARS=(
  "NEXT_PUBLIC_SOROBAN_RPC_URL"
  "NEXT_PUBLIC_NETWORK_PASSPHRASE"
  "NEXT_PUBLIC_HORIZON_URL"
)

# Load environment file
set -a
source "$ENV_FILE"
set +a

MISSING=0

echo ""
echo "Checking required variables..."
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
    MISSING=1
  else
    echo "✅ Found: $var"
  fi
done

# Environment-specific checks
if [ "$ENVIRONMENT" = "production" ]; then
  echo ""
  echo "Checking production-specific variables..."
  
  if [ -z "$NEXT_PUBLIC_CROWDFUND_CONTRACT_ID" ]; then
    echo "❌ Missing: NEXT_PUBLIC_CROWDFUND_CONTRACT_ID (required for production)"
    MISSING=1
  else
    echo "✅ Found: NEXT_PUBLIC_CROWDFUND_CONTRACT_ID"
  fi
  
  if [ -z "$NEXT_PUBLIC_REGISTRY_CONTRACT_ID" ]; then
    echo "❌ Missing: NEXT_PUBLIC_REGISTRY_CONTRACT_ID (required for production)"
    MISSING=1
  else
    echo "✅ Found: NEXT_PUBLIC_REGISTRY_CONTRACT_ID"
  fi
  
  # Validate mainnet configuration
  if [[ "$NEXT_PUBLIC_SOROBAN_RPC_URL" != *"mainnet"* ]]; then
    echo "⚠️  Warning: RPC URL doesn't contain 'mainnet' - is this correct?"
  fi
  
  if [[ "$NEXT_PUBLIC_NETWORK_PASSPHRASE" != "Public Global Stellar Network"* ]]; then
    echo "❌ Error: Production must use mainnet passphrase"
    MISSING=1
  fi
fi

if [ "$ENVIRONMENT" = "staging" ] || [ "$ENVIRONMENT" = "development" ]; then
  echo ""
  echo "Checking testnet configuration..."
  
  if [[ "$NEXT_PUBLIC_SOROBAN_RPC_URL" != *"testnet"* ]]; then
    echo "⚠️  Warning: RPC URL doesn't contain 'testnet' - is this correct?"
  fi
  
  if [[ "$NEXT_PUBLIC_NETWORK_PASSPHRASE" != "Test SDF Network"* ]]; then
    echo "❌ Error: Non-production must use testnet passphrase"
    MISSING=1
  fi
fi

echo ""
if [ $MISSING -eq 0 ]; then
  echo "✅ All required variables are set"
  exit 0
else
  echo "❌ Validation failed - missing required variables"
  exit 1
fi
