#!/bin/bash
set -e

# Environment Configuration Switcher
# Switches between development, staging, and production configurations

ENVIRONMENT=${1:-development}
SOURCE_FILE="apps/interface/.env.${ENVIRONMENT}"
TARGET_FILE="apps/interface/.env.local"

echo "🔄 Switching to environment: $ENVIRONMENT"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "❌ Environment file not found: $SOURCE_FILE"
  echo ""
  echo "Available environments:"
  ls -1 apps/interface/.env.* 2>/dev/null | sed 's/.*\.env\./  - /' || echo "  (none found)"
  exit 1
fi

# Backup existing .env.local if it exists
if [ -f "$TARGET_FILE" ]; then
  BACKUP_FILE="${TARGET_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
  echo "📦 Backing up current config to: $BACKUP_FILE"
  cp "$TARGET_FILE" "$BACKUP_FILE"
fi

# Copy environment file
echo "📝 Copying $SOURCE_FILE to $TARGET_FILE"
cp "$SOURCE_FILE" "$TARGET_FILE"

# Validate the configuration
echo ""
./scripts/validate-env.sh "$ENVIRONMENT"

echo ""
echo "✅ Successfully switched to $ENVIRONMENT environment"
echo ""
echo "Next steps:"
echo "  1. Review $TARGET_FILE"
echo "  2. Fill in any missing contract IDs or API keys"
echo "  3. Run 'npm run dev' to start the development server"
