# Runbook: FrontendErrorSpike

**Alert:** `FrontendErrorSpike`
**Severity:** critical
**Service:** frontend
**Dashboard:** [Frontend Logs](http://grafana:3000/d/frontend-logs)

## What is happening

The frontend service is logging more than **5 errors per minute** for at least **3 consecutive minutes**. This typically means users are hitting runtime errors, failed API calls, or rendering failures at scale.

## Impact

- Users may see blank pages, error boundaries, or stale data.
- Conversion rates (contributions) may be dropping.
- Wallet interactions may be broken.

## Diagnosis steps

1. **Check Grafana logs panel** — filter `service="frontend"` and `level=error`.
2. **Look for patterns** in the error messages:
   - Same error repeating → likely a code regression in the latest deploy.
   - Variety of errors → dependency or infrastructure issue.
3. **Check recent deployments:**
   ```bash
   gh run list --workflow frontend_ci.yml --limit 5
   gh run list --workflow frontend-canary.yml --limit 3
   ```
4. **Tail live container logs:**
   ```bash
   docker logs -f fmc-stable --tail 100
   ```
5. **Check external dependencies** — Stellar RPC, Horizon, IPFS/Pinata (see [StellarRPCFailure runbook](./stellar-rpc-failure.md)).

## Remediation

- **Code regression** — trigger a rollback via the blue-green or canary workflow:
  ```bash
  gh workflow run blue-green-deploy.yml -f environment=production
  # or rollback the canary:
  ./scripts/canary-frontend.sh rollback --canary-port 3001
  ```
- **External dependency** — enable the RPC fallback URL (`NEXT_PUBLIC_RPC_URL_FALLBACK`) in the environment config and redeploy.
- **Configuration error** — review `apps/interface/.env.production` for missing or incorrect values.

## Escalation

If errors persist after 15 minutes and cannot be attributed to a known cause, escalate to the on-call engineer and open an incident in PagerDuty.

## See also

- [Canary Deployment Guide](../canary-deployment.md)
- [Blue-Green Deployment Guide](../blue-green-deployment.md)
- [Environment Config](../environment-config.md)
