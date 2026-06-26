# Integration Examples

Self-contained, runnable code samples for the most common Fund-My-Cause integration patterns.

| Example | Language | Description |
|---------|----------|-------------|
| [basic-campaign](./basic-campaign/) | TypeScript | Deploy, fund, and withdraw a campaign end-to-end |
| [campaign-list](./campaign-list/) | TypeScript | Fetch all campaigns from the registry and display stats |
| [donation-matching](./donation-matching/) | TypeScript | Set up a 1:1 sponsor matching pool |
| [contribution-widget](./contribution-widget/) | React/TSX | Drop-in contribution button component |
| [event-listener](./event-listener/) | TypeScript | Listen for on-chain contribution events |

## Running an example

Each example is a standalone Node/TypeScript project.

```bash
cd examples/basic-campaign
cp .env.example .env   # fill in your testnet credentials
npm install
npm start
```

## Prerequisites

- Node.js 18+
- A funded Stellar **testnet** keypair
- A deployed crowdfund contract (see [Getting Started](../docs/tutorials/getting-started.md))
