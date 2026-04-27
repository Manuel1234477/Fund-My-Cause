# Secret Management and Rotation

This document covers secret management procedures and automated rotation for Fund-My-Cause.

## Overview

Secrets requiring rotation include:
- Stellar network deployer keys
- Soroban RPC API keys
- Database credentials
- Third-party service API keys

## Rotation Schedule

Secrets are rotated every **90 days** via automated GitHub Actions workflow.

| Secret | Rotation Interval | Last Rotated | Next Rotation |
|--------|-------------------|--------------|---------------|
| `STELLAR_SECRET_KEY` | 90 days | - | - |
| `SOROBAN_RPC_API_KEY` | 90 days | - | - |
| `DATABASE_PASSWORD` | 90 days | - | - |

## Automated Rotation

### Scheduled Rotation

The `secret-rotation.yml` workflow runs automatically on the 1st of each month at 2 AM UTC:

```yaml
schedule:
  - cron: '0 2 1 * *'
```

### Manual Rotation

Trigger rotation manually via GitHub Actions:

```bash
# Via GitHub CLI
gh workflow run secret-rotation.yml -f force=true

# Via GitHub UI
# 1. Go to Actions → Secret Rotation
# 2. Click "Run workflow"
# 3. Set "force" to true
# 4. Click "Run workflow"
```

### Rotation Script

The `scripts/rotate-secrets.sh` script handles rotation logic:

```bash
# Dry run (show what would be rotated)
./scripts/rotate-secrets.sh --dry-run

# Force rotation
./scripts/rotate-secrets.sh --force

# Normal rotation (respects interval)
./scripts/rotate-secrets.sh
```

## Rotation Log

All rotations are logged to `.secrets/rotation.log`:

```
2026-04-27T14:46:26Z - Rotated: STELLAR_SECRET_KEY
2026-04-27T14:46:27Z - Rotated: SOROBAN_RPC_API_KEY
2026-04-27T14:46:28Z - Rotated: DATABASE_PASSWORD
```

## GitHub Actions Secrets

Store all secrets as GitHub Actions secrets:

1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add secret name and value
4. Click **Add secret**

### Required Secrets

| Secret | Description | Rotation |
|--------|-------------|----------|
| `STELLAR_SECRET_KEY` | Deployer keypair for Stellar network | 90 days |
| `SOROBAN_RPC_API_KEY` | API key for Soroban RPC endpoint | 90 days |
| `DATABASE_PASSWORD` | Database connection password | 90 days |
| `SENTRY_DSN` | Sentry error tracking DSN | As needed |
| `PINATA_API_KEY` | Pinata IPFS API key | As needed |

## Environment Variables

Never commit secrets to version control. Use environment variables:

```bash
# .env.local (local development, never commit)
STELLAR_SECRET_KEY=S...
SOROBAN_RPC_API_KEY=...
DATABASE_PASSWORD=...

# .env.production (production, use GitHub Actions secrets)
# Injected at deployment time
```

## Rotation Procedures

### Stellar Secret Key Rotation

1. Generate new keypair:
   ```bash
   stellar keys generate --network testnet
   ```

2. Fund new account with test XLM

3. Update `STELLAR_SECRET_KEY` in GitHub Actions secrets

4. Verify deployment works with new key

5. Archive old key securely

### RPC API Key Rotation

1. Generate new API key from RPC provider

2. Update `SOROBAN_RPC_API_KEY` in GitHub Actions secrets

3. Update `.env.local` and deployment configs

4. Verify RPC connectivity

5. Revoke old API key

### Database Password Rotation

1. Generate new password (minimum 32 characters, mixed case + numbers + symbols)

2. Update database user password

3. Update `DATABASE_PASSWORD` in GitHub Actions secrets

4. Update all service connections

5. Verify database connectivity

## Monitoring and Alerts

### Rotation Alerts

The workflow sends notifications on:
- **Success**: Secrets rotated successfully
- **Failure**: Rotation check failed, manual review needed

### Verification

After rotation, verify:
1. All services are using new credentials
2. No authentication errors in logs
3. Deployments complete successfully
4. RPC calls are working
5. Database queries are executing

## Best Practices

1. **Never log secrets** — Ensure rotation scripts don't output sensitive values
2. **Use strong passwords** — Minimum 32 characters with mixed case, numbers, symbols
3. **Rotate on schedule** — Don't wait for suspected compromise
4. **Archive old secrets** — Keep encrypted backups for audit trails
5. **Test rotation** — Verify services work with new credentials before production
6. **Document changes** — Log all rotations with timestamps and who performed them
7. **Limit access** — Only authorized personnel should manage secrets
8. **Use secret scanning** — Enable GitHub's secret scanning to detect accidental commits

## Emergency Rotation

If a secret is compromised:

1. **Immediately revoke** the compromised secret
2. **Generate new secret** with strong randomness
3. **Update all services** with new secret
4. **Verify no unauthorized access** in logs
5. **Document incident** with timestamp and actions taken
6. **Notify stakeholders** of the security event

## References

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Stellar Key Management](https://developers.stellar.org/docs/build/guides/security)
- [OWASP Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
