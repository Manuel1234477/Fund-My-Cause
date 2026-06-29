# Runbook: SorobanTransactionFailed / ContributionFlowFailure

**Alerts:** `SorobanTransactionFailed`, `ContributionFlowFailure`
**Severity:** critical / warning
**Service:** contracts, frontend
**Dashboard:** [Contract Transactions](http://grafana:3000/d/contract-transactions)

## What is happening

The logs show repeated smart-contract transaction failures. This means calls to the Soroban crowdfund contract (`initialize`, `contribute`, `withdraw`, `refund_single`, etc.) are returning errors.

## Impact

- Users cannot contribute to campaigns.
- Campaign creators cannot withdraw funds.
- Refunds may be blocked.

## Diagnosis steps

1. **Identify the failing contract call** in logs:
   ```
   {service=~"frontend|indexer"} |~ "(?i)(transaction failed|tx_failed|invoke.*error)"
   ```
2. **Attempt a manual invocation** using the Stellar CLI:
   ```bash
   stellar contract invoke \
     --id <CONTRACT_ID> \
     --network testnet \
     -- get_stats
   ```
3. **Check Stellar network status:**
   - Testnet: https://dashboard.stellar.org/#testnet
   - Mainnet: https://dashboard.stellar.org/
4. **Check for fee / resource exhaustion:**
   - Inspect the transaction result XDR for `txINSUFFICIENT_FEE` or `opINSUFFICIENT_RESOURCES`.
   - If so, increase `fee` in the client SDK call.
5. **Check contract version** — a recent upgrade may have introduced a breaking change:
   ```bash
   stellar contract info --id <CONTRACT_ID> --network testnet
   ```
6. **Check the indexer** — if it is behind, the frontend may be sending stale ledger sequences.

## Remediation

- **Temporary fee fix** — bump `NEXT_PUBLIC_MAX_FEE` in the environment config.
- **Contract bug** — roll back to the previous contract version:
  ```bash
  stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/crowdfund.wasm \
    --network testnet \
    --source deployer
  # Update NEXT_PUBLIC_CONTRACT_ID with the new contract ID
  ```
- **Network congestion** — wait and retry; add exponential back-off in the frontend SDK client.

## Escalation

If on-chain transactions are consistently failing and the issue is not a network outage, escalate to the smart-contract team immediately. Users' funds are at risk if `refund_single` is broken.

## See also

- [Contract API Reference](../api/crowdfund.md)
- [Refund Model](../refund-model.md)
- [Contract Upgrades](../contract-upgrades.md)
