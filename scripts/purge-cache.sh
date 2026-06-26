#!/usr/bin/env bash
set -euo pipefail

# Usage: ./purge-cache.sh [--soft] <key1> [key2 ...]
# Example: ./purge-cache.sh campaigns
# Example: ./purge-cache.sh --soft campaign:CAABC123

CACHE_ENDPOINT="${CACHE_API_ENDPOINT:-http://localhost:3000}"
API_KEY="${CACHE_API_KEY:-}"

SOFT=false
KEYS=()

for arg in "$@"; do
  if [ "$arg" = "--soft" ]; then
    SOFT=true
  else
    KEYS+=("$arg")
  fi
done

if [ ${#KEYS[@]} -eq 0 ]; then
  echo "Usage: $0 [--soft] <key1> [key2 ...]"
  exit 1
fi

BODY=$(printf '%s\n' "${KEYS[@]}" | jq -R . | jq -s '{surrogateKeys: ., soft: $soft}' --argjson soft "$SOFT")

curl -s -X POST "${CACHE_ENDPOINT}/api/cache" \
  -H "Content-Type: application/json" \
  ${API_KEY:+-H "x-api-key: $API_KEY"} \
  -d "$BODY" | jq .
