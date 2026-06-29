# Frontend Canary Deployment

Canary rollout strategy for the Fund-My-Cause frontend that routes a configurable slice of traffic to the new version and automatically rolls back on error-rate regression.

## Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Load Balancer                        │
│             (nginx / cloud LB / Vercel edge)             │
└──────────┬───────────────────────────────┬───────────────┘
           │ ~90% stable traffic           │ ~10% canary
    ┌──────▼──────┐                 ┌──────▼──────┐
    │   Stable    │                 │   Canary    │
    │  :3000      │                 │  :3001      │
    │ (current)   │                 │  (new)      │
    └─────────────┘                 └─────────────┘
```

The canary receives a configurable traffic percentage (default **10%**). Prometheus metrics or HTTP health checks determine whether the error rate stays below the configured threshold. If it does, the canary is promoted to stable; if not, it is automatically removed and the stable version continues serving all traffic.

## Quick Start

### Trigger via GitHub Actions

1. Go to **Actions → Frontend Canary Deployment → Run workflow**
2. Choose environment (`staging` or `production`)
3. Optionally set a custom `canary_weight` (1–20%) and `image_tag`
4. Click **Run workflow**

### Trigger via CLI

```bash
gh workflow run frontend-canary.yml \
  -f environment=staging \
  -f canary_weight=10 \
  -f image_tag=abc1234
```

## Configuration

| Input / Env Var | Default | Description |
|---|---|---|
| `canary_weight` | `10` | Initial traffic percentage routed to canary |
| `environment` | `staging` | `staging` or `production` |
| `image_tag` | commit SHA | Docker image tag to deploy |
| `ERROR_RATE_THRESHOLD` | `5` | Max error rate (%) before rollback |
| `OBSERVATION_WINDOW` | `120` | Seconds to observe before promoting |
| `HEALTH_CHECK_INTERVAL` | `15` | Seconds between health probes |

## Deployment Phases

1. **Build** — Docker image is built and cached.
2. **Deploy canary** — New image starts on port 3001; stable remains on 3000.
3. **Smoke tests** — Key routes (`/`, `/campaigns`) must return HTTP 200.
4. **Monitor** — Health checks run every `HEALTH_CHECK_INTERVAL` seconds for `OBSERVATION_WINDOW` seconds. If the error rate exceeds `ERROR_RATE_THRESHOLD`, rollback is triggered immediately.
5. **Promote or rollback** — On success the canary replaces stable; on failure the canary is stopped and stable keeps serving all traffic.

## Automatic Rollback

Rollback is triggered automatically when:

- Any smoke test fails (non-2xx response on key routes)
- The error rate during the observation window exceeds `ERROR_RATE_THRESHOLD`%
- The workflow job fails for any other reason (`if: failure()`)

A Slack notification is sent on both rollback and successful promotion.

## Manual Rollback

```bash
# Stop the canary container
./scripts/canary-frontend.sh rollback --canary-port 3001
```

## Helper Script

`scripts/canary-frontend.sh` provides sub-commands used by the workflow:

```bash
# Wait for instance to become ready
./scripts/canary-frontend.sh wait_ready 3001

# Run smoke tests
./scripts/canary-frontend.sh smoke_test 3001

# Monitor and emit rollback decision
./scripts/canary-frontend.sh monitor \
  --port 3001 \
  --duration 120 \
  --interval 15 \
  --error-threshold 5

# Promote canary to stable
./scripts/canary-frontend.sh promote \
  --stable-port 3000 \
  --canary-port 3001 \
  --image-tag abc1234

# Rollback (stop canary, keep stable)
./scripts/canary-frontend.sh rollback --canary-port 3001
```

## Load Balancer Integration

For production environments, configure your load balancer / reverse proxy to weight traffic between the two instances:

### nginx example

```nginx
upstream frontend {
    server localhost:3000 weight=90;  # stable
    server localhost:3001 weight=10;  # canary
}
```

Adjust the weights to match the configured `canary_weight`. After promotion, point all traffic back to `localhost:3000`.

### Vercel / cloud platforms

For serverless deployments (Vercel, Cloudflare Pages) use the platform's built-in canary / gradual rollout feature or a feature-flag service to split traffic at the edge.

## Secrets Required

| Secret | Description |
|---|---|
| `SLACK_WEBHOOK_URL` | Incoming webhook for rollback and promotion alerts |

## See Also

- [Blue-Green Deployment](./blue-green-deployment.md)
- [CI/CD Guide](./ci-cd.md)
- [Monitoring Guide](./monitoring.md)
