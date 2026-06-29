# Runbook: ContributionFlowFailure

**Alert:** `ContributionFlowFailure`
**Severity:** warning
**Service:** frontend
**Dashboard:** [Frontend Logs](http://grafana:3000/d/frontend-logs)

## What is happening

The frontend is logging errors specifically in the contribution / pledge flow. Users attempting to donate to campaigns are encountering failures.

## Impact

- Donors cannot complete contributions.
- Campaign funding progress stalls.
- Platform revenue is directly affected.

## Diagnosis steps

1. **Filter logs for contribution errors:**
   ```
   {service="frontend"} |~ "(?i)(contribute.*fail|pledge.*fail|contribution.*error)"
   ```
2. **Check whether PledgeModal renders without errors:**
   - Open a campaign page and click **Contribute**.
   - Inspect the browser console for JavaScript errors.
3. **Verify contract invocation** — test `contribute` via the playground:
   ```bash
   cd playground && node scripts/contribute.js
   ```
4. **Check the Soroban RPC** — see [StellarRPCFailure runbook](./stellar-rpc-failure.md).
5. **Check token balance** — contributions fail if the user's wallet has insufficient XLM.

## Remediation

- **Contract or RPC issue** — follow [SorobanTransactionFailed runbook](./soroban-transaction-failures.md).
- **UI regression** — roll back the frontend.
- **Min-contribution threshold mismatch** — verify `min_contribution` value on-chain:
  ```bash
  stellar contract invoke --id <CONTRACT_ID> --network testnet -- min_contribution
  ```
  Ensure the frontend enforces the same value.

## See also

- [Contract API Reference](../api/crowdfund.md)
- [Refund Model](../refund-model.md)
- [Playground](../../playground/README.md)
