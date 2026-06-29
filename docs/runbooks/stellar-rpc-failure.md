# Runbook: StellarRPCFailure / RPCHighLatency

**Alerts:** `StellarRPCFailure`, `RPCHighLatency`
**Severity:** critical / warning
**Service:** rpc
**Dashboard:** [RPC Health](http://grafana:3000/d/rpc-health)

## What is happening

Services are logging failures or timeouts when communicating with the Stellar Soroban RPC endpoint or the Horizon REST API. This is the layer that connects the application to the Stellar network.

## Impact

- All on-chain reads (campaign stats, contribution history) will fail or return stale data.
- Transaction submission will fail.
- The indexer will fall behind on ledger ingestion.

## Diagnosis steps

1. **Check the RPC endpoint directly:**
   ```bash
   # Soroban RPC
   curl -s https://soroban-testnet.stellar.org \
     -H 'Content-Type: application/json' \
     -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

   # Horizon
   curl -s https://horizon-testnet.stellar.org/
   ```
2. **Check Stellar network status:**
   - https://status.stellar.org/ (mainnet)
   - https://dashboard.stellar.org/
3. **Check configured RPC URL** in the environment:
   ```bash
   grep NEXT_PUBLIC_RPC_URL apps/interface/.env.production
   grep RPC_URL services/indexer/.env
   ```
4. **Check rate limiting** — if receiving HTTP 429, the application is being throttled.
5. **Check DNS resolution:**
   ```bash
   nslookup soroban-mainnet.stellar.org
   ```

## Remediation

- **Switch to fallback RPC** — update `NEXT_PUBLIC_RPC_URL` to a backup provider (e.g., a self-hosted Quicksilver node or Blockdaemon) and redeploy.
- **Rate-limited** — implement request queuing in the SDK client and/or upgrade to a paid RPC tier.
- **Stellar network outage** — no immediate fix; communicate to users via the status page and monitor https://status.stellar.org/.
- **Self-hosted node down** — restart the Stellar Core / Quicksilver container:
  ```bash
  docker restart stellar-rpc
  ```

## Escalation

If the Stellar mainnet itself is degraded, escalate to the Stellar Developer Discord (`#mainnet-alerts`) and open an incident ticket. No application-level fix is possible during a network outage.

## See also

- [RPC Caching](../rpc-caching.md)
- [Environment Config](../environment-config.md)
- [Monitoring Guide](../monitoring.md)
