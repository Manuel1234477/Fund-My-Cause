# Indexer Service

Off-chain indexer service for Fund-My-Cause. Ingests Soroban contract events and provides fast queries via REST API.

## Quick Start

### Environment Variables

```bash
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org:443
CROWDFUND_CONTRACT_ID=<your-contract-id>
PORT=3001
LOG_LEVEL=info
```

### Install & Build

```bash
npm install
npm run build
npm start
```

### Development

```bash
npm run dev
```

## API Endpoints

### Health Check

```bash
GET /health
```

Returns service health status with ledger position and event count.

```json
{
  "status": "healthy",
  "uptime": 12345,
  "lastEventTime": 1704067200000,
  "lastLedger": 12345678,
  "eventsProcessed": 450
}
```

### Readiness Check

```bash
GET /ready
```

Returns `200` if indexer is running and ingesting events, `503` otherwise.

### Query Events

```bash
GET /events?contractId=<id>&limit=100
GET /events?type=<event-type>&limit=100
GET /events?limit=100
```

Query contract events by contract ID, event type, or get all recent events.

```json
{
  "count": 3,
  "events": [
    {
      "id": "12345-0",
      "timestamp": 1704067200000,
      "type": "Contribute",
      "contractId": "CXXX",
      "data": { "contributor": "GXXX", "amount": "1000000000" }
    }
  ]
}
```

### Service Stats

```bash
GET /stats
```

Get overall service statistics.

```json
{
  "eventCount": 450,
  "health": "healthy",
  "uptime": 12345,
  "lastLedger": 12345678,
  "eventsProcessed": 450
}
```

## Architecture

- **RPC Client**: Connects to Soroban RPC and streams contract events
- **Event Store**: In-memory event storage, the single live data-access layer for this service
- **Health Checker**: Tracks service health and metrics
- **Express Server**: REST API (`/events`, `/stats`, `/health`, `/ready`) for querying indexed data

### Data-access decision (#837)

This service previously carried two disconnected data-access implementations: this
in-memory `EventStore` (wired into `src/index.ts` and actually running in production),
and a fully separate Postgres/GraphQL/REST stack (`src/db/**`, `graphql-resolvers.ts`,
`graphql-server.ts`, `rest-api.ts`, `ingestor.ts`) that was never imported by
`src/index.ts` and never ran.

That Postgres stack has been removed rather than wired up, because it was not a
functioning alternative to recover:
- It depended on `pg`, `graphql`, `dataloader`, and `express-graphql`, none of which
  were ever declared in `package.json` — it never actually installed or type-checked.
- `ingestor.ts` and `db/queryStats.test.ts` imported sibling modules via incorrect
  relative paths, so even in isolation the code did not resolve.
- The ingestion shape it expected (`initialize`/`contribute`/`withdraw`/`refund`
  domain events) does not match what `rpc-client.ts` actually produces
  (generic `IndexerEvent`s) — there was no working bridge between the two.

The in-memory `EventStore` remains the single, intentional data-access
implementation for now. Its known limitation is that indexed events do not survive a
restart; replacing it with a durable store is tracked as future work and should be
designed against the real event shape produced by `rpc-client.ts`, not resurrected
from the deleted code above.

## Next Steps

- [ ] Add event type parsing and validation
- [ ] Implement event indexing for campaign state (raised, contributors, etc.)
- [ ] Design a durable (e.g. persistent) event store that survives restarts
- [ ] Implement event replay and backfill
- [ ] Add alerting and monitoring
