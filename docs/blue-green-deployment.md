# Blue-Green Deployment Guide

Zero-downtime deployments for the Fund-My-Cause frontend using blue-green deployment strategy.

## Overview

Blue-green deployment maintains two identical production environments:
- **Blue**: Currently active environment serving traffic
- **Green**: Staging environment for new deployments

When deploying, the new version is deployed to the inactive slot, tested, and traffic is switched only after validation.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                        │
│                  (nginx/HAProxy)                        │
└────────────────┬──────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ┌───▼────┐        ┌───▼────┐
    │  Blue  │        │ Green  │
    │ :3000  │        │ :3001  │
    └────────┘        └────────┘
```

## Prerequisites

- Docker and Docker Compose installed
- GitHub Actions runner with Docker support
- Environment-specific `.env` files configured
- Load balancer or reverse proxy setup (nginx/HAProxy)

## Deployment Process

### 1. Manual Trigger

Trigger the workflow via GitHub Actions UI:

```bash
# Navigate to Actions > Blue-Green Deployment > Run workflow
# Select environment: staging or production
```

### 2. Automated Steps

The workflow performs:

1. **Build**: Creates Docker image with timestamp tag
2. **Deploy**: Launches new version on inactive slot
3. **Health Checks**: Validates deployment readiness
4. **Smoke Tests**: Runs basic functionality tests
5. **Traffic Switch**: Routes traffic to new slot
6. **Verification**: Confirms traffic switch success
7. **Rollback**: Automatic rollback on any failure

### 3. Health Checks

The deployment validates:

- Container startup and readiness
- HTTP health endpoint (`/health`)
- API connectivity (`/api/health`)
- Homepage loads successfully
- Campaign API responds

### 4. Automatic Rollback

If any step fails:

1. Deployment is marked as failed
2. Traffic remains on active slot
3. Failed container is stopped
4. Previous version continues serving traffic

## Configuration

### Environment Variables

Create `.env.staging` and `.env.production`:

```bash
NEXT_PUBLIC_CONTRACT_ID=<contract-id>
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
```

### Load Balancer Setup (nginx)

```nginx
upstream backend {
    server localhost:3000;  # Blue slot
}

server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

To switch traffic, update the upstream:

```bash
# Switch to Green (port 3001)
sed -i 's/server localhost:3000;/server localhost:3001;/' /etc/nginx/nginx.conf
nginx -s reload
```

## Monitoring

### Check Active Slot

```bash
cat /tmp/staging_active_slot.txt  # Returns: blue or green
cat /tmp/production_active_slot.txt
```

### View Deployment Logs

```bash
# Blue slot logs
docker logs fund-my-cause-blue

# Green slot logs
docker logs fund-my-cause-green
```

### Health Status

```bash
# Check Blue slot
curl http://localhost:3000/health

# Check Green slot
curl http://localhost:3001/health
```

## Rollback Procedure

### Manual Rollback

If issues occur after deployment:

```bash
# 1. Identify active slot
ACTIVE=$(cat /tmp/production_active_slot.txt)

# 2. Switch back to previous slot
if [ "$ACTIVE" = "green" ]; then
    # Switch to blue
    sed -i 's/server localhost:3001;/server localhost:3000;/' /etc/nginx/nginx.conf
    echo "blue" > /tmp/production_active_slot.txt
else
    # Switch to green
    sed -i 's/server localhost:3000;/server localhost:3001;/' /etc/nginx/nginx.conf
    echo "green" > /tmp/production_active_slot.txt
fi

# 3. Reload load balancer
nginx -s reload

# 4. Verify
curl http://localhost:3000/health
```

### Automatic Rollback

The workflow automatically rolls back if:

- Health checks fail
- Smoke tests fail
- Traffic switch verification fails

## Best Practices

1. **Test Before Deployment**
   - Run full test suite before triggering deployment
   - Verify all changes in staging first

2. **Monitor After Switch**
   - Watch logs for errors
   - Monitor performance metrics
   - Check error rates

3. **Gradual Rollout**
   - Deploy to staging first
   - Validate thoroughly
   - Then deploy to production

4. **Maintenance Windows**
   - Schedule deployments during low-traffic periods
   - Notify users of potential brief disruptions
   - Have rollback plan ready

5. **Database Migrations**
   - Run migrations before deployment
   - Ensure backward compatibility
   - Test rollback scenarios

## Troubleshooting

### Deployment Stuck Waiting

```bash
# Check if container is running
docker ps | grep fund-my-cause

# Check container logs
docker logs fund-my-cause-green

# Manually check health endpoint
curl -v http://localhost:3001/health
```

### Traffic Not Switching

```bash
# Verify load balancer config
cat /etc/nginx/nginx.conf

# Check active slot file
cat /tmp/production_active_slot.txt

# Manually reload nginx
nginx -s reload
```

### Rollback Failed

```bash
# Stop all containers
docker stop fund-my-cause-blue fund-my-cause-green

# Restart previous version
docker run -d \
  --name fund-my-cause-blue \
  -p 3000:3000 \
  --env-file apps/interface/.env.production \
  fund-my-cause:blue-latest

# Verify
curl http://localhost:3000/health
```

## Integration with CI/CD

### Automated Deployment on Release

Add to your release workflow:

```yaml
- name: Trigger Blue-Green Deployment
  if: github.event_name == 'release'
  uses: actions/github-script@v7
  with:
    script: |
      await github.rest.actions.createWorkflowDispatch({
        owner: context.repo.owner,
        repo: context.repo.repo,
        workflow_id: 'blue-green-deploy.yml',
        ref: 'main',
        inputs: {
          environment: 'production'
        }
      })
```

## Performance Considerations

- **Deployment Time**: ~2-5 minutes (build + health checks)
- **Downtime**: 0 seconds (traffic switches instantly)
- **Resource Usage**: 2x frontend containers running during deployment
- **Disk Space**: Ensure sufficient space for Docker images

## Security

- Use GitHub Environments for access control
- Require approvals for production deployments
- Audit all deployment activities
- Rotate secrets regularly
- Use private Docker registries for production

## See Also

- [Deployment Guide](./deployment.md)
- [Docker Guide](./docker.md)
- [CI/CD Guide](./ci-cd.md)

---

## Backend Services (API & Indexer)

The same blue-green pattern applies to the two backend services:

| Service | Blue port | Green port |
|---|---|---|
| Recommendation API | 8000 | 8001 |
| Fraud Detection API | 8002 | 8003 |

### Architecture

```
┌─────────────────────────────────────────────────┐
│                  Load Balancer                  │
│               (nginx / HAProxy)                 │
└───────────────┬─────────────────────────────────┘
                │
     ┌──────────┴──────────┐
     │                     │
 ┌───▼────┐           ┌───▼────┐
 │  Blue  │           │ Green  │
 │ :8000  │           │ :8001  │
 └────────┘           └────────┘
  (active)             (standby)
```

### Slot Definitions

Each slot runs a dedicated container (or k8s Deployment) tagged with the image SHA:

```bash
# Blue slot — currently serving traffic
docker run -d --name recommendations-blue -p 8000:8000 \
  fund-my-cause/recommendations:blue-latest

# Green slot — deploy new version here first
docker run -d --name recommendations-green -p 8001:8000 \
  fund-my-cause/recommendations:<new-sha>
```

Repeat the same pattern for the fraud-detection service on ports 8002/8003.

### Health-Gated Traffic Switch

Only switch traffic once the new slot passes its health check:

```bash
#!/usr/bin/env bash
set -euo pipefail

NEW_PORT=${1:?usage: switch-backend.sh <new_port> <service_name>}
SERVICE=${2:?}
NGINX_CONF=/etc/nginx/conf.d/${SERVICE}.conf

# 1. Wait for health
for i in $(seq 1 30); do
  if curl -sf "http://localhost:${NEW_PORT}/health" > /dev/null; then
    echo "Health check passed on port ${NEW_PORT}"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 5
  [[ $i -eq 30 ]] && { echo "Health check timed out"; exit 1; }
done

# 2. Atomically rewrite the upstream and reload
sed -i "s/server localhost:[0-9]\+;/server localhost:${NEW_PORT};/" "${NGINX_CONF}"
nginx -s reload
echo "Traffic switched to port ${NEW_PORT}"
```

### Database Migration Compatibility

Backend services share a read-only view of indexed chain data. When a migration is needed:

1. **Add columns only** — never drop or rename in the same release.
2. Deploy the new schema with the *green* slot before switching traffic.
3. The *blue* slot continues reading the old columns (which still exist) until it is replaced.
4. After the switch is stable (≥ 1 deployment cycle), drop deprecated columns in a follow-up migration.

This ensures both slots are compatible with the live schema at all times.

### Rollback

```bash
# Identify the currently active port
ACTIVE=$(cat /tmp/${SERVICE}_active_port.txt)

# Switch back to the previous port
PREVIOUS=$([ "$ACTIVE" = "8000" ] && echo "8001" || echo "8000")
bash scripts/switch-backend.sh "$PREVIOUS" "$SERVICE"

# Stop the failed slot
docker stop ${SERVICE}-green
```

Rollback restores the previous slot in < 30 seconds. The failed container is stopped but not deleted — its logs remain available for post-mortem analysis.

### CI/CD Integration

```yaml
# .github/workflows/blue-green-deploy.yml (backend jobs)
- name: Deploy green slot
  run: docker run -d --name ${{ env.SERVICE }}-green -p ${{ env.GREEN_PORT }}:8000
       fund-my-cause/${{ env.SERVICE }}:${{ github.sha }}

- name: Switch traffic
  run: bash scripts/switch-backend.sh ${{ env.GREEN_PORT }} ${{ env.SERVICE }}

- name: Stop old blue slot
  run: docker stop ${{ env.SERVICE }}-blue || true
```

### Acceptance Criteria

- Backend releases swap with **zero downtime**: health check gates the switch.
- Rollback **restores the previous slot cleanly** in < 30 seconds.
- Both slots are always **DB-migration compatible** via additive-only schema changes.
