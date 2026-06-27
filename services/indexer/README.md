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
- **Event Store**: In-memory event storage (can be replaced with PostgreSQL)
- **Health Checker**: Tracks service health and metrics
- **Express Server**: REST API for querying indexed data

## Next Steps

- [ ] Replace in-memory store with PostgreSQL
- [ ] Add event type parsing and validation
- [ ] Implement event indexing for campaign state (raised, contributors, etc.)
- [ ] Add GraphQL API layer
- [ ] Implement event replay and backfill
- [ ] Add alerting and monitoring
