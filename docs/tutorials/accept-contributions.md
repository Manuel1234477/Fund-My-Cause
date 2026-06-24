# Accept Contributions in Your App

This tutorial shows how to build a contribution flow using the Fund-My-Cause JS SDK and Freighter wallet.

## Install the SDK

```bash
# From the repo root
npm install ./sdks/js

# Or once published to npm:
# npm install @fund-my-cause/sdk
```

## Basic contribution flow

```tsx
// components/ContributeButton.tsx
"use client";

import { useState } from "react";
import { FmcClient } from "@fund-my-cause/sdk";
import { useWallet } from "@/context/WalletContext";

interface Props {
  contractId: string;
  minContributionXlm: number;
}

export function ContributeButton({ contractId, minContributionXlm }: Props) {
  const { address, signTx, connect, isSigning } = useWallet();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const client = new FmcClient({
    contractId,
    rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL!,
    networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE!,
    horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL!,
  });

  async function handleContribute() {
    if (!address) return connect();

    const xlm = parseFloat(amount);
    if (isNaN(xlm) || xlm < minContributionXlm) {
      setError(`Minimum contribution is ${minContributionXlm} XLM`);
      return;
    }

    setStatus("pending");
    setError("");

    try {
      await client.contribute({
        contributor: address,
        amountXlm: xlm,
        tokenId: process.env.NEXT_PUBLIC_XLM_TOKEN_ID!,
        signTx,
      });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Contribution failed.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={`Min ${minContributionXlm} XLM`}
        disabled={status === "pending"}
        className="border rounded px-3 py-2 w-full"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {status === "done" ? (
        <p className="text-green-600 font-medium">Contribution submitted!</p>
      ) : (
        <button
          onClick={handleContribute}
          disabled={status === "pending" || isSigning}
          className="bg-indigo-600 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          {status === "pending" ? "Processing…" : address ? "Contribute" : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}
```

## Fetching live campaign stats

```ts
const client = new FmcClient({ contractId, rpcUrl, networkPassphrase, horizonUrl });
const stats = await client.getStats();

console.log(`Raised: ${stats.raisedXlm} / ${stats.goalXlm} XLM`);
console.log(`Progress: ${stats.progressPercent}%`);
console.log(`Contributors: ${stats.contributorCount}`);
```

## Polling for updates

```ts
// Refresh stats every 30 seconds
const interval = setInterval(async () => {
  const stats = await client.getStats();
  setStats(stats);
}, 30_000);

return () => clearInterval(interval);
```

## Handling errors

```ts
import { FmcContractError } from "@fund-my-cause/sdk";

try {
  await client.contribute({ contributor, amountXlm, tokenId, signTx });
} catch (e) {
  if (e instanceof FmcContractError) {
    switch (e.code) {
      case 9:  showError("Amount is below the minimum contribution."); break;
      case 2:  showError("This campaign has ended.");                  break;
      case 11: showError("This campaign is temporarily paused.");      break;
      default: showError(`Contract error ${e.code}.`);
    }
  } else {
    showError("Network error. Please try again.");
  }
}
```

## Optimistic UI update

To make the UI feel instant while the transaction confirms:

```ts
// Before submitting
onOptimisticContribute?.(xlmAmount);

try {
  await client.contribute({ ... });
  onSuccess?.();
} catch {
  onRollbackOptimistic?.(); // revert optimistic update
  throw;
}
```

## Next steps

- [Build a campaign dashboard →](./campaign-dashboard.md)
- [Donation matching →](./donation-matching.md)
- [JS SDK reference →](../../sdks/js/README.md)
