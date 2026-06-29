# Runbook: BackendErrorSpike

**Alert:** `BackendErrorSpike`
**Severity:** critical
**Service:** indexer | graphql-api | monitoring-service
**Dashboard:** [Backend Logs](http://grafana:3000/d/backend-logs)

## What is happening

One or more backend services (`indexer`, `graphql-api`, `monitoring-service`) are logging more than **3 errors per minute** for at least **3 consecutive minutes**.

## Impact

- Campaign data may not be indexed or may return stale results.
- GraphQL queries from the frontend may fail.
- Monitoring alerts may not fire (if monitoring-service is affected).

## Diagnosis steps

1. **Identify the affected service** in Grafana:
   ```
   {service=~"indexer|graphql-api|monitoring-service"} | json | level="error"
   ```
2. **Check service health:**
   ```bash
   docker ps | grep -E "indexer|graphql|monitoring"
   curl -s http://localhost:4000/health   # graphql-api
   curl -s http://localhost:4001/health   # indexer
   ```
3. **Review recent deployments** for the affected service.
4. **Check database / Redis connectivity** — many backend errors originate from connection issues.
5. **Review Stellar RPC errors** — the indexer reads on-chain events; RPC outages cascade as backend errors.

## Remediation

- **Restart the affected container:**
  ```bash
  docker restart fund-my-cause-indexer
  ```
- **Scale down and back up** if the service is stuck:
  ```bash
  kubectl rollout restart deployment/indexer -n fund-my-cause
  ```
- **Check and flush Redis** if the cache is corrupted:
  ```bash
  redis-cli FLUSHDB
  ```

## Escalation

Escalate if errors persist for more than 20 minutes or if the indexer falls more than 100 ledgers behind.

## See also

- [Log Aggregation Guide](../log-aggregation.md)
- [Architecture Overview](../architecture.md)
