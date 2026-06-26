# @fund-my-cause/sdk — JavaScript / TypeScript SDK

A typed client for interacting with Fund-My-Cause Soroban contracts from any JavaScript environment (Node.js, browser, Next.js).

## Installation

```bash
# From the monorepo root (local link)
npm install ./sdks/js

# Once published to npm
npm install @fund-my-cause/sdk
```

## Requirements

| Peer dependency | Version |
|----------------|---------|
| `@stellar/stellar-sdk` | `^14.0.0` |

## Quick start

```ts
import { FmcClient } from "@fund-my-cause/sdk";

const client = new FmcClient({
  contractId:        "C...",
  rpcUrl:            "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  horizonUrl:        "https://horizon-testnet.stellar.org",
});

// Read campaign stats (no wallet required)
const stats = await client.getStats();
console.log(`${stats.raisedXlm} / ${stats.goalXlm} XLM (${stats.progressPercent}%)`);

// Contribute (requires wallet signing function)
await client.contribute({
  contributor: "G...",
  amountXlm:  10,
  tokenId:    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  signTx,     // (xdr: string) => Promise<string>
});
```

## API reference

Full reference: [src/index.ts](./src/index.ts)

### Constructor

```ts
new FmcClient(config: FmcClientConfig)

interface FmcClientConfig {
  contractId:        string;
  rpcUrl:            string;
  networkPassphrase: string;
  horizonUrl:        string;
}
```

### Read methods (no auth)

| Method | Returns | Description |
|--------|---------|-------------|
| `getStats()` | `CampaignStats` | Live funding metrics |
| `getCampaignInfo()` | `CampaignInfo` | Full metadata snapshot |
| `getPerformanceMetrics()` | `PerformanceMetrics` | Velocity and trend data |
| `getContribution(address)` | `number` (XLM) | Contribution for one address |
| `listContributors(opts)` | `string[]` | Paginated contributor addresses |
| `getMatchingConfig()` | `MatchingConfig \| null` | Active matching config |
| `getTotalMatched()` | `number` (XLM) | Total matched so far |
| `getMatchingPool()` | `number` (XLM) | Remaining unspent pool |
| `isContributor(address)` | `boolean` | Whether address has contributed |
| `getContributionHistory(address)` | `ContributionRecord[]` | Per-address history |

### Write methods (require `signTx`)

| Method | Description |
|--------|-------------|
| `contribute(opts)` | Pledge tokens |
| `withdraw(opts)` | Creator claims funds |
| `refundSingle(opts)` | Contributor claims refund |
| `setupMatching(opts)` | Sponsor sets up matching pool |
| `refundMatchingSponsor(opts)` | Refund unused matching pool |
| `cancelCampaign(opts)` | Creator cancels the campaign |

### Registry methods

```ts
import { FmcRegistryClient } from "@fund-my-cause/sdk";

const registry = new FmcRegistryClient({
  contractId: "C...", // registry contract id
  rpcUrl,
  networkPassphrase,
  horizonUrl,
});

const page = await registry.list({ offset: 0, limit: 20 });
const tech  = await registry.getByCampaignCategory({ categoryId: 1, offset: 0, limit: 10 });
```

## Error handling

```ts
import { FmcContractError } from "@fund-my-cause/sdk";

try {
  await client.contribute({ ... });
} catch (e) {
  if (e instanceof FmcContractError) {
    console.error(`Contract error ${e.code}: ${e.message}`);
  }
}
```

See [../../docs/api/errors.md](../../docs/api/errors.md) for all error codes.

## Building

```bash
cd sdks/js
npm install
npm run build   # outputs to dist/
npm test        # runs Jest tests
```
