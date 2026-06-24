# Donation Matching Integration

Donation matching lets a sponsor multiply each contribution up to a fixed cap — a proven crowdfunding growth mechanism.

## How it works

1. Creator calls `setup_matching(sponsor, ratio, cap)`.
2. `cap` XLM is escrowed from the sponsor into the contract immediately.
3. On each contribution, `matched = amount × ratio / 10 000` is added to `total_raised` (capped at remaining pool).
4. When the campaign ends, any unused pool is automatically returned to the sponsor.

## Setup (Rust test)

```rust
// 1:1 match up to 500 XLM
client.setup_matching(
    &sponsor,
    &10_000u32,          // 10 000 bps = 1:1
    &5_000_000_000i128,  // 500 XLM cap
);
```

## Setup (TypeScript via SDK)

```ts
import { FmcClient } from "@fund-my-cause/sdk";

const client = new FmcClient({ contractId, rpcUrl, networkPassphrase, horizonUrl });

await client.setupMatching({
  sponsorAddress: sponsor,
  matchRatioBps: 10_000,   // 1:1
  maxMatchXlm: 500,
  signTx,                  // must be signed by BOTH creator AND sponsor
});
```

> Both `creator` and `sponsor` must authorize the setup transaction. Freighter only signs for one key at a time; for multi-party signing, build the transaction manually and collect both signatures.

## Reading match state

```ts
const config = await client.getMatchingConfig();
// { sponsor, matchRatioBps: 10_000, maxMatchXlm: 500 }

const totalMatched = await client.getTotalMatched();  // XLM matched so far
const poolRemaining = await client.getMatchingPool(); // XLM still available
```

## Displaying match info in UI

```tsx
function MatchBadge({ contractId }: { contractId: string }) {
  const [config, setConfig] = useState<MatchingConfig | null>(null);

  useEffect(() => {
    client.getMatchingConfig().then(setConfig);
  }, []);

  if (!config) return null;

  const ratioLabel = config.matchRatioBps === 10_000 ? "1:1" :
    `${config.matchRatioBps / 100}%`;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
      🎯 <strong>{ratioLabel} match</strong> active — up to{" "}
      {config.maxMatchXlm} XLM sponsored by{" "}
      <code>{config.sponsor.slice(0, 8)}…</code>
    </div>
  );
}
```

## Contribution suggestion engine (issue #632)

The `PledgeModal` automatically incorporates `goalStroops` and `raisedStroops` to suggest amounts that would reach milestones with matching applied. Pass these props when the campaign has an active match:

```tsx
<PledgeModal
  contractId={contractId}
  campaignTitle={title}
  minContribution={minContributionStroops}
  maxContribution={maxContributionStroops}
  goalStroops={goalStroops}
  raisedStroops={raisedStroops}   // matching already included
/>
```

## Manual sponsor refund after cancellation

If a campaign is cancelled before the matching cap is exhausted:

```ts
await client.refundMatchingSponsor({ creatorAddress: creator, signTx });
```

This calls `refund_matching_sponsor()` and returns the unused pool to the sponsor.
