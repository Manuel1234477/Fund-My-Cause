# Runbook: AuthenticationFailureSpike

**Alert:** `AuthenticationFailureSpike`
**Severity:** warning
**Service:** frontend
**Dashboard:** [Frontend Logs](http://grafana:3000/d/frontend-logs)

## What is happening

The frontend is logging more than **10 authentication/wallet failures per minute** for at least **5 consecutive minutes**. This may indicate a broken Freighter wallet integration, a UX regression, or unusual user behaviour.

## Impact

- Users cannot connect their wallets or sign transactions.
- Contribution and withdrawal flows are blocked for affected users.

## Diagnosis steps

1. **Identify the error pattern:**
   ```
   {service="frontend"} |~ "(?i)(auth.*fail|wallet.*error|freighter.*error|sign.*rejected)"
   ```
2. **Check Freighter extension status** — https://www.freighter.app/
3. **Check for a recent frontend deploy** that touched `WalletContext`, `@stellar/freighter-api`, or transaction signing logic.
4. **Test wallet connection locally:**
   ```bash
   cd apps/interface && npm run dev
   # Open http://localhost:3000 and attempt wallet connect in browser
   ```
5. **Distinguish user rejection from errors** — "sign.*rejected" may mean users are just declining — inspect the ratio.

## Remediation

- **Integration regression** — roll back the frontend to the previous version.
- **Freighter API breaking change** — update `@stellar/freighter-api` to the latest version:
  ```bash
  npm update @stellar/freighter-api --prefix apps/interface
  ```
- **Network mismatch** — ensure `NEXT_PUBLIC_NETWORK_PASSPHRASE` matches the network the user's wallet is configured for.

## False-positive tuning

If this alert fires frequently during low-traffic periods (e.g., due to automated tests using wallets), increase the threshold in `infrastructure/monitoring/log-alert-rules.yml`:
```yaml
expr: |
  sum(rate({service="frontend"} |~ "(?i)(auth.*fail|...)" [5m])) > 20/60
```

## See also

- [Wallet Adapters Guide](../wallet-adapters.md)
- [Security Best Practices](../security-best-practices.md)
- [Frontend Integration](../frontend-integration.md)
