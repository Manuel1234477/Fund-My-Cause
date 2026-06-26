# Incident Response Procedures

Detailed procedures for detecting, responding to, and recovering from security incidents in Fund-My-Cause.

---

## 1. Incident Response Overview

### 1.1 Goals

1. **Minimize Impact**: Quickly contain and mitigate the incident
2. **Preserve Evidence**: Collect data for investigation and learning
3. **Restore Service**: Return to normal operations as quickly as possible
4. **Communicate**: Keep stakeholders informed throughout the process
5. **Learn**: Conduct post-mortem analysis to prevent recurrence

### 1.2 Incident Response Team

| Role | Responsibilities | Contact |
|------|------------------|---------|
| **Incident Commander** | Coordinates response, makes decisions, communicates status | [incident-commander@fund-my-cause.org] |
| **Security Lead** | Investigates technical details, determines root cause | [security@fund-my-cause.org] |
| **DevOps Lead** | Deploys fixes, manages infrastructure, performs rollbacks | [devops@fund-my-cause.org] |
| **Communications Lead** | Prepares user communications, manages public messaging | [communications@fund-my-cause.org] |
| **Legal/Compliance** | Advises on disclosure requirements, regulatory obligations | [legal@fund-my-cause.org] |

### 1.3 Incident Severity Levels

| Level | Impact | Response Time | Examples |
|-------|--------|----------------|----------|
| **P1 - Critical** | Funds at risk, contract compromise, data breach | Immediate (< 1 hour) | Unauthorized withdrawal, reentrancy, private key exposure |
| **P2 - High** | Significant security issue, service degradation | 4 hours | XSS vulnerability, phishing campaign, unauthorized access |
| **P3 - Medium** | Moderate security issue, limited impact | 24 hours | Dependency vulnerability, weak validation, information disclosure |
| **P4 - Low** | Minor security issue, no immediate risk | 1 week | Documentation gap, outdated library, non-critical bug |

---

## 2. Incident Detection

### 2.1 Detection Methods

#### Automated Monitoring
- Security scanning tools (SAST, DAST, dependency scanning)
- Intrusion detection systems
- Log analysis and anomaly detection
- Performance monitoring and alerting
- Uptime monitoring

#### Manual Detection
- Security researcher reports
- User reports
- Code review findings
- Penetration testing
- Vulnerability scanning

#### Indicators of Compromise (IOCs)

**Smart Contract Indicators:**
- Unexpected fund transfers
- Unauthorized withdrawals
- Incorrect refund amounts
- State inconsistencies
- Unusual gas usage

**Frontend Indicators:**
- Unexpected JavaScript errors
- Failed wallet connections
- Incorrect contract addresses displayed
- Unusual network requests
- Performance degradation

**Infrastructure Indicators:**
- Unauthorized access attempts
- Unusual traffic patterns
- Failed deployments
- Compromised credentials
- Suspicious log entries

### 2.2 Detection Workflow

```
Anomaly Detected
    ↓
Verify Issue
    ↓
Classify Severity
    ↓
Notify Incident Response Team
    ↓
Activate Response Procedures
```

---

## 3. Incident Reporting

### 3.1 Reporting Channels

**For Security Researchers:**
- GitHub Security Advisories: https://github.com/Fund-My-Cause/Fund-My-Cause/security/advisories/new
- Email: security@fund-my-cause.org
- PGP Key: [Available on GitHub]

**For Team Members:**
- Slack: #security-incidents
- Email: incident-commander@fund-my-cause.org
- Phone: [Emergency contact number]

**For Users:**
- Support: support@fund-my-cause.org
- GitHub Issues: https://github.com/Fund-My-Cause/Fund-My-Cause/issues

### 3.2 Incident Report Template

```
**Incident Title**: [Brief description]

**Severity**: [P1/P2/P3/P4]

**Reporter**: [Name and contact]

**Date/Time Discovered**: [ISO 8601 format]

**Description**:
[Detailed description of the issue]

**Affected Components**:
- [ ] Smart contract (crowdfund)
- [ ] Smart contract (registry)
- [ ] Frontend
- [ ] CI/CD
- [ ] Infrastructure
- [ ] Other: ___________

**Reproduction Steps**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Impact Assessment**:
- Funds at risk: [Yes/No]
- User data exposed: [Yes/No]
- Service unavailable: [Yes/No]
- Estimated impact: [Description]

**Proof of Concept** (if applicable):
[Code, screenshots, or detailed steps]

**Suggested Fix** (if applicable):
[Any suggestions for remediation]
```

---

## 4. Initial Assessment (0-1 hour)

### 4.1 Incident Commander Activation

1. **Receive Report**: Incident is reported via one of the channels above
2. **Acknowledge**: Confirm receipt and assign incident number
3. **Notify Team**: Page incident response team members
4. **Create War Room**: Establish communication channel (Slack, Zoom, etc.)
5. **Assign Roles**: Designate team members to specific roles

### 4.2 Severity Classification

Classify the incident based on:

**Impact Factors:**
- Number of users affected
- Amount of funds at risk
- Sensitivity of data exposed
- Duration of service disruption
- Reputational damage

**Urgency Factors:**
- Active exploitation
- Public disclosure
- Regulatory requirements
- Media attention

**Classification Decision Tree:**

```
Is there active exploitation or funds at risk?
├─ Yes → P1 (Critical)
└─ No
    ├─ Is there significant data exposure or service disruption?
    │  ├─ Yes → P2 (High)
    │  └─ No
    │      ├─ Is there a moderate security issue?
    │      │  ├─ Yes → P3 (Medium)
    │      │  └─ No → P4 (Low)
```

### 4.3 Initial Triage

1. **Verify the Issue**: Reproduce the vulnerability or confirm the report
2. **Assess Scope**: Determine which components are affected
3. **Identify Risks**: Determine potential impact and risks
4. **Determine Urgency**: Classify severity level
5. **Decide on Containment**: Determine if immediate action is needed

### 4.4 Stakeholder Notification

**For P1 Incidents:**
- Notify all incident response team members immediately
- Notify executive leadership
- Prepare for potential public disclosure

**For P2 Incidents:**
- Notify incident response team
- Notify relevant department heads
- Prepare communication template

**For P3/P4 Incidents:**
- Notify security team
- Document in incident tracking system
- Schedule response meeting

---

## 5. Containment (1-4 hours for P1)

### 5.1 Immediate Actions

#### For Smart Contract Vulnerabilities

```bash
# 1. Verify the vulnerability
stellar contract invoke --id <CONTRACT_ID> --network testnet -- get_stats

# 2. Check for unauthorized transactions
stellar contract invoke --id <CONTRACT_ID> --network testnet -- total_raised

# 3. Review recent transactions
stellar transactions --account <CONTRACT_ID> --limit 100

# 4. If necessary, pause operations (if contract supports it)
# Note: Current contract does not support pause, so consider deployment of new contract
```

#### For Frontend Vulnerabilities

```bash
# 1. Take down the interface (if necessary)
# Contact hosting provider to disable the site

# 2. Investigate the vulnerability
# Review recent code changes and deployments

# 3. Prepare a fix
# Develop and test the fix on a staging environment

# 4. Prepare for redeployment
# Have rollback plan ready
```

#### For CI/CD Vulnerabilities

```bash
# 1. Revoke compromised credentials
# Rotate GitHub tokens, deploy keys, AWS credentials

# 2. Audit recent deployments
# Review what was deployed and when

# 3. Investigate the compromise
# Review access logs and audit trails

# 4. Secure the pipeline
# Update secrets, review workflows, enable additional checks
```

### 5.2 Containment Strategies

| Incident Type | Containment Strategy |
|---------------|----------------------|
| Unauthorized withdrawal | Deploy new contract, migrate funds |
| XSS vulnerability | Take down frontend, deploy fix |
| Compromised credentials | Revoke credentials, rotate secrets |
| Dependency vulnerability | Update dependency, redeploy |
| Data breach | Notify affected users, secure systems |

### 5.3 Evidence Preservation

1. **Collect Logs**: Gather all relevant logs before any cleanup
   ```bash
   # Collect application logs
   docker logs <container_id> > incident_logs.txt
   
   # Collect system logs
   journalctl -u fund-my-cause > system_logs.txt
   
   # Collect blockchain data
   stellar transactions --account <ADDRESS> > blockchain_data.txt
   ```

2. **Take Snapshots**: Capture system state
   ```bash
   # Take database snapshot
   pg_dump fund_my_cause > db_snapshot.sql
   
   # Capture file system state
   tar -czf filesystem_snapshot.tar.gz /var/fund-my-cause
   ```

3. **Document Timeline**: Record all actions taken
   - Time of detection
   - Time of notification
   - Time of containment actions
   - Time of each step

---

## 6. Investigation (4-24 hours for P1)

### 6.1 Root Cause Analysis

1. **Gather Information**
   - Collect all relevant logs and data
   - Interview reporters and affected users
   - Review recent changes and deployments

2. **Analyze the Vulnerability**
   - Understand how the vulnerability works
   - Determine how it was introduced
   - Identify similar vulnerabilities

3. **Determine Impact**
   - How many users are affected?
   - How much data is exposed?
   - How much money is at risk?
   - What is the timeline of the incident?

4. **Document Findings**
   - Create detailed incident report
   - Include timeline of events
   - Include technical analysis
   - Include impact assessment

### 6.2 Investigation Checklist

- [ ] Vulnerability is reproduced and verified
- [ ] Root cause is identified
- [ ] Scope of impact is determined
- [ ] Affected users/campaigns are identified
- [ ] Timeline of incident is established
- [ ] Similar vulnerabilities are searched for
- [ ] Logs are collected and analyzed
- [ ] Evidence is preserved
- [ ] Investigation findings are documented

### 6.3 Investigation Tools

```bash
# Analyze blockchain transactions
stellar transactions --account <ADDRESS> --limit 1000 | jq '.records[] | select(.created_at > "2026-06-01T00:00:00Z")'

# Check contract state
stellar contract invoke --id <CONTRACT_ID> --network testnet -- get_stats

# Review deployment history
git log --oneline --all | head -20

# Analyze logs for anomalies
grep -i "error\|warning\|unauthorized" application.log | tail -100

# Check for suspicious network activity
netstat -an | grep ESTABLISHED
```

---

## 7. Remediation (4-48 hours for P1)

### 7.1 Fix Development

1. **Develop Fix**
   - Write code to fix the vulnerability
   - Ensure fix does not introduce new vulnerabilities
   - Document the fix

2. **Test Fix**
   - Unit tests for the fix
   - Integration tests for the fix
   - Security review of the fix
   - Test on staging environment

3. **Prepare Deployment**
   - Create deployment plan
   - Prepare rollback plan
   - Document deployment steps
   - Get approval from incident commander

### 7.2 Deployment

#### For Smart Contract Fixes

```bash
# 1. Build the fixed contract
cargo build --release --target wasm32-unknown-unknown \
  --manifest-path contracts/crowdfund/Cargo.toml

# 2. Verify the WASM hash
sha256sum target/wasm32-unknown-unknown/release/crowdfund.wasm

# 3. Deploy to testnet first
./scripts/deploy.sh <CREATOR> <TOKEN> <GOAL> <DEADLINE> <MIN_CONTRIB> <TITLE> <DESC> <LINKS> <REGISTRY_ID> --network testnet

# 4. Test on testnet
# Run comprehensive tests

# 5. Deploy to mainnet
./scripts/deploy.sh <CREATOR> <TOKEN> <GOAL> <DEADLINE> <MIN_CONTRIB> <TITLE> <DESC> <LINKS> <REGISTRY_ID> --network mainnet

# 6. Verify deployment
stellar contract invoke --id <NEW_CONTRACT_ID> --network mainnet -- version
```

#### For Frontend Fixes

```bash
# 1. Fix the vulnerability
# Make code changes

# 2. Build the frontend
npm run build

# 3. Test the build
npm run test

# 4. Deploy to staging
npm run deploy:staging

# 5. Test on staging
# Run comprehensive tests

# 6. Deploy to production
npm run deploy:production

# 7. Verify deployment
# Check that the fix is in place
```

### 7.3 Verification

- [ ] Fix is deployed to production
- [ ] Fix is verified to be working
- [ ] Vulnerability is no longer exploitable
- [ ] No new vulnerabilities are introduced
- [ ] Performance is acceptable
- [ ] Monitoring shows normal operation

---

## 8. Communication (Ongoing)

### 8.1 Internal Communication

**Incident War Room Updates:**
- Update every 30 minutes during active incident
- Include current status, next steps, and blockers
- Include estimated time to resolution

**Slack Notifications:**
- Post updates to #security-incidents channel
- Include severity level and status
- Include action items and assignments

**Email Notifications:**
- Send updates to stakeholders
- Include incident summary and status
- Include estimated time to resolution

### 8.2 External Communication

**User Notification (for P1/P2 incidents):**

```
Subject: Security Update - Fund-My-Cause

Dear Fund-My-Cause Users,

We have identified and are actively addressing a security issue in Fund-My-Cause.

**What happened:**
[Brief description of the issue]

**What we're doing:**
[Description of remediation efforts]

**What you should do:**
[Recommended user actions, if any]

**Timeline:**
- [Time]: Issue detected
- [Time]: Incident response activated
- [Time]: Fix deployed
- [Time]: Verification complete

We will provide updates every [X hours] until the issue is resolved.

For more information, see [Link to security advisory].

Thank you for your patience and trust in Fund-My-Cause.

Security Team
```

**Public Disclosure (after fix is deployed):**

```
Subject: Security Advisory - Fund-My-Cause [SEVERITY]

We have identified and resolved a [SEVERITY] security issue in Fund-My-Cause.

**Vulnerability Details:**
- Type: [Type of vulnerability]
- Severity: [CVSS score]
- Affected Component: [Component]
- Affected Versions: [Versions]

**What happened:**
[Description of the vulnerability]

**Who is affected:**
[Affected users/campaigns]

**What we did:**
[Mitigation steps taken]

**What you should do:**
[Recommended user actions]

**Timeline:**
- [Date]: Issue discovered
- [Date]: Fix deployed
- [Date]: Public disclosure

**Credit:**
[Credit security researcher if applicable]

For more information, see [Link to detailed report].
```

---

## 9. Recovery & Restoration

### 9.1 Service Restoration

1. **Verify Fix**: Confirm the fix is working correctly
2. **Monitor**: Watch for any signs of recurrence
3. **Restore Service**: Bring systems back to normal operation
4. **Verify Operations**: Confirm all systems are functioning normally

### 9.2 Data Recovery (if necessary)

```bash
# 1. Restore from backup
pg_restore -d fund_my_cause db_snapshot.sql

# 2. Verify data integrity
SELECT COUNT(*) FROM campaigns;
SELECT SUM(amount) FROM contributions;

# 3. Reconcile with blockchain
# Verify on-chain state matches database

# 4. Notify users of any data loss
# If applicable, provide compensation or explanation
```

### 9.3 Rollback Procedure (if necessary)

```bash
# 1. Identify the previous working version
git log --oneline | head -5

# 2. Revert to previous version
git revert <COMMIT_SHA>

# 3. Rebuild and redeploy
cargo build --release --target wasm32-unknown-unknown
./scripts/deploy.sh ...

# 4. Verify rollback
stellar contract invoke --id <CONTRACT_ID> --network mainnet -- version

# 5. Notify users
# Explain the rollback and next steps
```

---

## 10. Post-Incident Review

### 10.1 Post-Mortem Meeting

**Timing**: Within 48 hours of incident resolution

**Attendees**: Incident response team, relevant stakeholders

**Agenda**:
1. Timeline of events
2. Root cause analysis
3. Impact assessment
4. What went well
5. What could be improved
6. Action items for prevention

### 10.2 Post-Mortem Report

**Contents**:
- Executive summary
- Timeline of events
- Root cause analysis
- Impact assessment
- Lessons learned
- Action items and owners
- Target completion dates

**Template**:
```markdown
# Post-Mortem Report: [Incident Title]

## Executive Summary
[Brief summary of the incident and resolution]

## Timeline
- [Time]: Event 1
- [Time]: Event 2
- [Time]: Event 3

## Root Cause
[Detailed root cause analysis]

## Impact
- Users affected: [Number]
- Funds at risk: [Amount]
- Duration: [Time]

## Lessons Learned
1. [Lesson 1]
2. [Lesson 2]
3. [Lesson 3]

## Action Items
| Action | Owner | Target Date |
|--------|-------|-------------|
| [Action 1] | [Owner] | [Date] |
| [Action 2] | [Owner] | [Date] |

## Prevention
[How to prevent similar incidents in the future]
```

### 10.3 Action Items

- [ ] Root cause is addressed
- [ ] Similar vulnerabilities are searched for and fixed
- [ ] Monitoring and alerting are improved
- [ ] Documentation is updated
- [ ] Security procedures are updated
- [ ] Team training is conducted
- [ ] Follow-up security audit is scheduled

---

## 11. Incident Response Contacts

### 11.1 Primary Contacts

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Incident Commander | [Name] | [Email] | [Phone] |
| Security Lead | [Name] | [Email] | [Phone] |
| DevOps Lead | [Name] | [Email] | [Phone] |
| Communications Lead | [Name] | [Email] | [Phone] |

### 11.2 Escalation Path

1. **Level 1**: Incident response team
2. **Level 2**: Executive leadership
3. **Level 3**: Board of directors (if applicable)
4. **Level 4**: Legal and regulatory authorities (if applicable)

### 11.3 External Contacts

| Organization | Contact | Purpose |
|--------------|---------|---------|
| Stellar | [Contact] | Protocol vulnerabilities |
| Hosting Provider | [Contact] | Infrastructure issues |
| Legal Counsel | [Contact] | Regulatory compliance |
| Insurance | [Contact] | Coverage and claims |

---

## 12. Incident Response Drills

### 12.1 Drill Schedule

- **Monthly**: Tabletop exercises
- **Quarterly**: Simulated incidents
- **Annually**: Full-scale incident response drill

### 12.2 Drill Scenarios

1. **Smart Contract Vulnerability**: Unauthorized withdrawal detected
2. **Frontend Compromise**: XSS vulnerability discovered
3. **Credential Compromise**: GitHub token leaked
4. **Data Breach**: User data exposed
5. **Service Outage**: Infrastructure failure

### 12.3 Drill Evaluation

- [ ] Team responds within target time
- [ ] Communication is clear and timely
- [ ] Procedures are followed correctly
- [ ] Evidence is preserved
- [ ] Fix is deployed successfully
- [ ] Users are notified appropriately

---

## 13. Continuous Improvement

### 13.1 Metrics

- Mean Time to Detect (MTTD)
- Mean Time to Respond (MTTR)
- Mean Time to Resolution (MTTR)
- Number of incidents per quarter
- Severity distribution of incidents

### 13.2 Improvement Process

1. **Collect Metrics**: Track incident response metrics
2. **Analyze Trends**: Identify patterns and areas for improvement
3. **Update Procedures**: Improve incident response procedures
4. **Conduct Training**: Train team on improvements
5. **Measure Results**: Track improvement in metrics

---

**Last Updated**: 2026-06-01  
**Next Review**: 2026-09-01  
**Maintained By**: Security Team
