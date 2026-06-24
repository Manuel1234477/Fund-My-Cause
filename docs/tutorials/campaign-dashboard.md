# Build a Campaign Dashboard

This tutorial shows how to build a real-time campaign dashboard that displays stats, contributor history, and milestones.

## Fetching all campaign data in parallel

```ts
import { FmcClient } from "@fund-my-cause/sdk";

const client = new FmcClient({ contractId, rpcUrl, networkPassphrase, horizonUrl });

// Fetch everything in parallel — saves ~3× round-trip time
const [info, stats, metrics, contributors] = await Promise.all([
  client.getCampaignInfo(),
  client.getStats(),
  client.getPerformanceMetrics(),
  client.listContributors({ offset: 0, limit: 20 }),
]);
```

## Dashboard component

```tsx
"use client";

import { useEffect, useState } from "react";
import { FmcClient, CampaignInfo, CampaignStats } from "@fund-my-cause/sdk";

export function CampaignDashboard({ contractId }: { contractId: string }) {
  const [info, setInfo] = useState<CampaignInfo | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);

  const client = new FmcClient({
    contractId,
    rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL!,
    networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE!,
    horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL!,
  });

  useEffect(() => {
    async function load() {
      const [i, s] = await Promise.all([client.getCampaignInfo(), client.getStats()]);
      setInfo(i);
      setStats(s);
    }
    load();
    const id = setInterval(load, 15_000); // refresh every 15 s
    return () => clearInterval(id);
  }, [contractId]);

  if (!info || !stats) return <p>Loading…</p>;

  const progressPct = (stats.progressBps / 100).toFixed(1);
  const daysLeft = Math.max(
    0,
    Math.ceil((Number(info.deadline) - Date.now() / 1000) / 86400),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{info.title}</h1>
      <p className="text-gray-600">{info.description}</p>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>{stats.raisedXlm} XLM raised</span>
          <span>{progressPct}% of {stats.goalXlm} XLM goal</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all"
            style={{ width: `${Math.min(100, stats.progressBps / 100)}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <Stat label="Contributors" value={stats.contributorCount} />
        <Stat label="Days left"    value={daysLeft} />
        <Stat label="Avg pledge"   value={`${stats.avgContributionXlm} XLM`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
```

## Listening for new contributions via events

```ts
const server = new SorobanRpc.Server(rpcUrl);

// Poll for new "contributed" events every 30 s
async function pollEvents(fromLedger: number) {
  const result = await server.getEvents({
    startLedger: fromLedger,
    filters: [{
      type: "contract",
      contractIds: [contractId],
      topics: [[
        nativeToScVal("campaign", { type: "symbol" }).toXDR("base64"),
        nativeToScVal("contributed", { type: "symbol" }).toXDR("base64"),
      ]],
    }],
  });

  for (const ev of result.events) {
    const { contributor, amount } = ev.value.value(); // parse ScVal
    console.log(`New contribution: ${Number(amount) / 1e7} XLM from ${contributor}`);
  }

  return result.latestLedger;
}
```

## Paginating the contributor list

```ts
const PAGE_SIZE = 50;
let offset = 0;
const allContributors: string[] = [];

while (true) {
  const page = await client.listContributors({ offset, limit: PAGE_SIZE });
  if (page.length === 0) break;
  allContributors.push(...page);
  offset += PAGE_SIZE;
}
```

## Next steps

- [Donation matching →](./donation-matching.md)
- [Saved search & alerts →](./saved-search-alerts.md)
