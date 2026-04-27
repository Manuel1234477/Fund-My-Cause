# Disaster Recovery Plan

This document outlines the disaster recovery procedures for Fund-My-Cause, including backup strategies, recovery processes, and runbooks for common scenarios.

## Overview

The disaster recovery plan ensures:
- Critical data is backed up regularly
- Recovery procedures are tested and documented
- Recovery time objectives (RTO) are met
- Business continuity is maintained

## Recovery Time Objectives (RTO)

| Scenario | RTO | RPO |
|----------|-----|-----|
| Contract deployment failure | 1 hour | 1 day |
| Data loss | 4 hours | 1 day |
| Infrastructure failure | 2 hours | 1 hour |
| Security breach | 30 minutes | Real-time |

**RTO** = Recovery Time Objective (time to restore service)  
**RPO** = Recovery Point Objective (acceptable data loss)

## Backup Strategy

### Automated Daily Backups

Backups run automatically every day at 2 AM UTC via GitHub Actions:

```yaml
schedule:
  - cron: '0 2 * * *'
```

### Backup Contents

| Item | Frequency | Retention |
|------|-----------|-----------|
| Contract WASM artifacts | Daily | 30 days |
| Cargo.lock | Daily | 30 days |
| Environment config | Daily | 30 days |
| Workflow configurations | Daily | 30 days |
| Contract source code | Daily | 30 days |

### Backup Locations

- **Primary**: GitHub Actions artifacts (30-day retention)
- **Secondary**: Local `.backups/` directory
- **Archive**: Compressed `.tar.gz` files

## Backup Operations

### Create Backup

```bash
./scripts/backup.sh
```

Creates a new backup with timestamp:
```
.backups/backup-20260427-144626/
├── contracts/
├── contracts-src/
├── workflows/
├── Cargo.lock
├── .env.production.bak
└── metadata.json
```

### List Backups

```bash
./scripts/backup.sh --list
```

Shows all available backups with metadata:
```
| Backup ID | Date | Size | Status |
|-----------|------|------|--------|
| backup-20260427-144626 | 2026-04-27T14:46:26Z | 2.5M | ✓ Valid |
| backup-20260426-020000 | 2026-04-26T02:00:00Z | 2.4M | ✓ Valid |
```

### Restore from Backup

```bash
./scripts/backup.sh --restore backup-20260427-144626
```

Restores all backed-up files and requires confirmation.

## Recovery Procedures

### Scenario 1: Contract Deployment Failure

**Symptoms**: Contract deployment fails, transactions rejected

**RTO**: 1 hour

**Steps**:

1. **Identify the issue**
   ```bash
   # Check deployment logs
   git log --oneline -10
   cargo build --release --target wasm32-unknown-unknown
   ```

2. **Restore previous version**
   ```bash
   # List available backups
   ./scripts/backup.sh --list
   
   # Restore from last known good backup
   ./scripts/backup.sh --restore backup-20260426-020000
   ```

3. **Redeploy contract**
   ```bash
   ./scripts/deploy.sh <creator> <token> <goal> <deadline>
   ```

4. **Verify deployment**
   ```bash
   # Check contract on Stellar Expert
   # Verify transactions are processing
   ```

### Scenario 2: Data Loss

**Symptoms**: Configuration files deleted, environment variables lost

**RTO**: 4 hours

**Steps**:

1. **Assess damage**
   ```bash
   # Check what files are missing
   ls -la .env.production
   ls -la Cargo.lock
   ```

2. **Restore from backup**
   ```bash
   ./scripts/backup.sh --restore backup-20260427-144626
   ```

3. **Verify restored data**
   ```bash
   # Check file integrity
   cat .env.production
   cat Cargo.lock
   ```

4. **Rebuild if necessary**
   ```bash
   cargo build --release --target wasm32-unknown-unknown
   ```

### Scenario 3: Infrastructure Failure

**Symptoms**: GitHub Actions unavailable, deployment pipeline broken

**RTO**: 2 hours

**Steps**:

1. **Check GitHub status**
   - Visit https://www.githubstatus.com/

2. **Use local backup**
   ```bash
   # Restore from local backup
   ./scripts/backup.sh --restore backup-20260427-144626
   ```

3. **Manual deployment**
   ```bash
   # Deploy using local Stellar CLI
   stellar contract upload \
     --wasm target/wasm32-unknown-unknown/release/crowdfund.wasm \
     --source $STELLAR_SECRET_KEY \
     --network testnet
   ```

4. **Update configuration**
   ```bash
   # Update contract IDs in frontend
   # Redeploy frontend if needed
   ```

### Scenario 4: Security Breach

**Symptoms**: Unauthorized access detected, secrets compromised

**RTO**: 30 minutes

**Steps**:

1. **Immediate actions**
   - Revoke compromised secrets immediately
   - Rotate all API keys
   - Review access logs

2. **Restore from clean backup**
   ```bash
   # Use backup from before breach
   ./scripts/backup.sh --restore backup-20260425-020000
   ```

3. **Update secrets**
   ```bash
   # Generate new secrets
   ./scripts/rotate-secrets.sh --force
   ```

4. **Redeploy with new secrets**
   ```bash
   # Rebuild and redeploy
   cargo build --release --target wasm32-unknown-unknown
   ./scripts/deploy.sh <creator> <token> <goal> <deadline>
   ```

5. **Audit and investigation**
   - Review all access logs
   - Identify breach vector
   - Document incident
   - Implement preventive measures

## Testing Recovery Procedures

### Monthly Recovery Test

1. **Select a backup**
   ```bash
   ./scripts/backup.sh --list
   ```

2. **Create test environment**
   ```bash
   mkdir -p /tmp/recovery-test
   cd /tmp/recovery-test
   git clone <repo>
   ```

3. **Restore backup**
   ```bash
   ./scripts/backup.sh --restore backup-20260427-144626
   ```

4. **Verify restoration**
   ```bash
   # Check all files are present
   ls -la contracts/
   ls -la Cargo.lock
   ```

5. **Test rebuild**
   ```bash
   cargo build --release --target wasm32-unknown-unknown
   ```

6. **Document results**
   - Time to restore
   - Any issues encountered
   - Improvements needed

## Runbooks

### Runbook 1: Emergency Contract Redeployment

**Trigger**: Contract is unresponsive or behaving incorrectly

**Time**: 30 minutes

```bash
# 1. Stop current operations
# 2. Restore from backup
./scripts/backup.sh --restore backup-20260427-144626

# 3. Verify contract code
cargo build --release --target wasm32-unknown-unknown

# 4. Deploy new instance
./scripts/deploy.sh <creator> <token> <goal> <deadline>

# 5. Update frontend configuration
# Edit apps/interface/.env.local with new contract ID

# 6. Verify functionality
# Test all contract operations

# 7. Notify users
# Post status update
```

### Runbook 2: Database Recovery

**Trigger**: Database corruption or data loss

**Time**: 1 hour

```bash
# 1. Identify backup point
./scripts/backup.sh --list

# 2. Restore database from backup
# (Implementation depends on database system)

# 3. Verify data integrity
# Run consistency checks

# 4. Rebuild indexes if needed
# Optimize performance

# 5. Test application connectivity
# Verify all queries work

# 6. Monitor for issues
# Watch error logs
```

### Runbook 3: Secret Compromise Response

**Trigger**: Secret or API key exposed

**Time**: 15 minutes

```bash
# 1. Immediately revoke compromised secret
# (Contact service provider if needed)

# 2. Generate new secret
./scripts/rotate-secrets.sh --force

# 3. Update GitHub Actions secrets
# Go to Settings → Secrets and variables → Actions

# 4. Redeploy with new secrets
# Trigger deployment workflow

# 5. Monitor for unauthorized access
# Review logs for suspicious activity

# 6. Document incident
# Create incident report
```

## Backup Retention Policy

- **Daily backups**: Retained for 30 days
- **Weekly backups**: Retained for 90 days (manual)
- **Monthly backups**: Retained for 1 year (manual)
- **Disaster backups**: Retained indefinitely (manual)

## Monitoring and Alerts

### Backup Monitoring

- Daily backup completion status
- Backup size trends
- Backup integrity checks
- Restore test results

### Alerts

- Backup creation failure
- Backup size anomalies
- Restore test failures
- Recovery time exceeded

## Documentation

- **This file**: Disaster recovery plan
- **Backup script**: `scripts/backup.sh`
- **Backup workflow**: `.github/workflows/backup.yml`
- **Secret rotation**: `docs/secret-management.md`
- **Deployment guide**: `docs/deployment.md`

## Contacts and Escalation

| Role | Contact | Availability |
|------|---------|--------------|
| DevOps Lead | - | 24/7 |
| Infrastructure Team | - | Business hours |
| Security Team | - | 24/7 for breaches |

## References

- [GitHub Actions Artifacts](https://docs.github.com/en/actions/managing-workflow-runs/downloading-workflow-artifacts)
- [Stellar Backup Best Practices](https://developers.stellar.org/docs/build/guides/security)
- [NIST Disaster Recovery](https://csrc.nist.gov/publications/detail/sp/800-34/rev-1/final)
- [AWS Disaster Recovery](https://aws.amazon.com/disaster-recovery/)
