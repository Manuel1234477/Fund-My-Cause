# Fund My Cause Monitoring Infrastructure

Complete observability stack for the Fund My Cause DeFi platform with distributed tracing, metrics collection, visualization, and automated alerting.

## Quick Start

### Prerequisites
- Docker & Docker Compose (v20.10+)
- 2+ CPU cores
- 2GB+ available memory
- 50GB+ disk space (for 15-day retention)

### Start the Stack

```bash
# Navigate to monitoring directory
cd infrastructure/monitoring

# Start all services
docker-compose up -d

# Verify all services are running
docker-compose ps

# Check logs
docker-compose logs -f
```

### Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3000 | admin / admin |
| Prometheus | http://localhost:9090 | N/A |
| AlertManager | http://localhost:9093 | N/A |
| Jaeger | http://localhost:16686 | N/A |

## Architecture

### Components

#### 1. **Jaeger (Distributed Tracing)**
- End-to-end request tracing across microservices
- Service dependency mapping
- Latency analysis (p50, p95, p99)
- Error tracking and exception propagation
- Ports: 6831/udp, 6832/udp, 14268, 16686

#### 2. **OpenTelemetry Collector**
- Unified data collection point
- OTLP protocol support (gRPC & HTTP)
- Data transformation and filtering
- Intelligent sampling policies
- Ports: 4317 (gRPC), 4318 (HTTP)

#### 3. **Prometheus**
- Time-series metrics database
- 25+ pre-configured metrics
- 15-day data retention
- Alert rule evaluation
- Port: 9090

#### 4. **AlertManager**
- Alert routing and deduplication
- Multi-channel notifications (PagerDuty, Slack)
- Intelligent grouping and escalation
- 40+ alert rules configured
- Port: 9093

#### 5. **Grafana**
- Visualization dashboards
- 2 pre-configured dashboards
- Real-time charts and gauges
- Alert management UI
- Port: 3000

#### 6. **Node Exporter**
- System metrics collection
- CPU, memory, disk, network metrics
- Standard Prometheus format
- Port: 9100

## Configuration

### Prometheus Configuration (prometheus.yml)

**Scrape Targets:**
- Prometheus: Self-monitoring
- Node Exporter: System metrics (15s interval)
- OpenTelemetry Collector: Application metrics
- Fund My Cause App: Custom application metrics
- AlertManager, Grafana, Jaeger: Service metrics

**Alert Rules:** 40+ rules configured in `prometheus-alerts.yml`
- Application alerts (5 rules)
- Infrastructure alerts (4 rules)
- DeFi-specific alerts (4 rules)
- Business alerts (4 rules)
- Prometheus internal alerts (2 rules)

### AlertManager Configuration (alertmanager.yml)

**Alert Routing:**
| Severity | Channel | Wait Time | Repeat |
|----------|---------|-----------|--------|
| CRITICAL | PagerDuty + Slack | 0s | 5m |
| WARNING | Slack | 30s | 2h |
| INFO | Slack | 60s | 24h |
| BUSINESS | Slack (#business-metrics) | 5m | 1h |

**Slack Integration:**
- Update `YOUR_SLACK_WEBHOOK_URL` in alertmanager.yml

**PagerDuty Integration:**
- Update `YOUR_PAGERDUTY_SERVICE_KEY` in alertmanager.yml
- On-call integration enabled

### OpenTelemetry Collector (otel-collector-config.yml)

**Receivers:**
- OTLP: gRPC (4317) and HTTP (4318)
- Prometheus: Scrape metrics
- Jaeger: gRPC (14250) and HTTP (14268)
- Zipkin: HTTP (9411)

**Processors:**
- Batch: Optimize throughput
- Memory Limiter: Prevent OOM
- Attributes: Add custom attributes
- Sampling: Probabilistic sampling

**Exporters:**
- Jaeger: Distributed tracing
- Prometheus: Metrics storage
- Logging: Debug output

## Metrics

### Performance Metrics (6)
- `http_requests_total` - Total HTTP requests by method, path, status
- `http_request_duration_seconds` - Request latency (p50, p95, p99)
- `http_errors_total` - Total HTTP errors
- `db_query_duration_seconds` - Database query latency
- `cache_hits_total` - Successful cache lookups
- `cache_misses_total` - Cache misses

### Business Metrics (9)
- `campaign_total_created` - Total campaigns created
- `campaign_donations_total` - Total donations by campaign
- `campaign_success_total` - Successfully funded campaigns
- `tvl_total` - Total Value Locked
- `new_user_signups_total` - New user registrations
- `blockchain_transactions_total` - On-chain transactions
- `blockchain_transaction_failures_total` - Failed transactions
- `smart_contract_calls_failed_total` - Contract call failures
- `gas_price_gwei` - Current gas price

### Cost Metrics (3)
- `cost_compute_total` - Compute expenses
- `cost_storage_total` - Storage expenses
- `cost_bandwidth_total` - Bandwidth expenses

## Alert Rules

### Application Alerts (5)
1. **HighErrorRate** - Error rate > 5% for 5 min → CRITICAL
2. **HighLatency** - P95 latency > 1s for 5 min → WARNING
3. **ServiceDown** - Service unreachable for 1 min → CRITICAL
4. **DatabaseConnectionPoolExhausted** - Pool < 5 connections → WARNING
5. **CacheHitRateLow** - Hit rate < 70% for 10 min → INFO

### Infrastructure Alerts (4)
1. **HighCPUUsage** - CPU > 80% for 5 min → WARNING
2. **HighMemoryUsage** - Memory > 85% for 5 min → WARNING
3. **HighDiskUsage** - Disk > 85% for 5 min → WARNING
4. **ServiceNotRunning** - Service down for 2 min → CRITICAL

### DeFi Alerts (4)
1. **TVLDrop** - TVL drop > 5% per hour → WARNING
2. **TransactionFailureRateHigh** - Failure rate > 10% → CRITICAL
3. **GasPriceSpike** - Gas price > 200 Gwei for 5 min → INFO
4. **SmartContractErrors** - Contract errors > 0.01/sec → CRITICAL

### Business Alerts (4)
1. **LowCampaignSuccessRate** - Success rate < 70% for 30 min → WARNING
2. **RevenueShortfall** - Revenue < 80% of target for 2h → WARNING
3. **LowUserSignupRate** - Signups below daily target for 2h → INFO
4. **ZeroDonationsInPeriod** - No donations for 2h → WARNING

## Dashboards

### 1. Application Performance Monitoring
- Request rate (req/s) by service and status
- Error rate (%) with thresholds
- Latency percentiles (p50, p95, p99)
- HTTP status distribution
- Database query latency
- Cache hit rate gauge

### 2. Business Metrics
- Total Value Locked (TVL) - stat widget
- Active campaigns - counter
- Campaign success rate - gauge (with 70% threshold)
- Total contributors - counter
- Hourly donation rate - time series
- Daily revenue by campaign - bar chart
- Blockchain transactions (success/failure)
- Smart contract error rate

## Troubleshooting

### Services Not Starting

```bash
# Check logs for specific service
docker-compose logs jaeger
docker-compose logs prometheus
docker-compose logs grafana

# Verify container health
docker-compose ps

# Restart specific service
docker-compose restart prometheus
```

### High Memory Usage

```bash
# Check Prometheus TSDB usage
curl http://localhost:9090/api/v1/query?query=prometheus_tsdb_symbol_table_size_bytes

# Reduce retention period in docker-compose.yml
# Change --storage.tsdb.retention.time=15d to smaller value

# Restart Prometheus
docker-compose restart prometheus
```

### Alerts Not Firing

1. Check Prometheus alert evaluation:
   - Visit http://localhost:9090/alerts
   - Verify rule status (green = ok, red = pending)

2. Check AlertManager:
   - Visit http://localhost:9093
   - Check routing rules

3. Verify Slack/PagerDuty webhooks:
   - Update credentials in alertmanager.yml
   - Restart AlertManager: `docker-compose restart alertmanager`

### Metrics Not Appearing

1. Verify scrape targets:
   - Visit http://localhost:9090/targets
   - Check target health

2. Check OTLP endpoints:
   - Verify application is sending to `localhost:4317` (gRPC) or `localhost:4318` (HTTP)
   - Check OpenTelemetry Collector logs

3. Verify metric names:
   - Visit http://localhost:9090/graph
   - Test queries

## Production Deployment

### Kubernetes

```bash
# Convert docker-compose to Kubernetes manifests
kompose convert -f docker-compose.yml -o kubernetes/

# Apply manifests
kubectl apply -f kubernetes/

# Access services
kubectl port-forward svc/grafana 3000:3000
kubectl port-forward svc/prometheus 9090:9090
```

### Scaling

**Recommended for production:**
- 3+ Prometheus replicas with remote storage
- Grafana load balancer with HA
- Jaeger backend with Elasticsearch
- AlertManager with multiple replicas

### Security

- [ ] Enable TLS encryption for external connections
- [ ] Implement Grafana RBAC
- [ ] Use secrets manager for credentials
- [ ] Configure network policies
- [ ] Enable audit logging
- [ ] Regular security scanning

### Monitoring Stack Monitoring

Monitor the monitoring stack itself:

```bash
# Stack health endpoint
curl http://localhost:9090/-/healthy

# Prometheus targets
http://localhost:9090/targets

# AlertManager status
http://localhost:9093/api/v1/status

# Jaeger health
http://localhost:14268/api/traces/1
```

## Resource Usage

### Per Service (Estimated)
| Service | Memory | CPU | Disk |
|---------|--------|-----|------|
| Jaeger | 512MB | 0.5 core | 5GB |
| OpenTelemetry | 256MB | 0.2 core | 0 |
| Prometheus | 1GB | 1 core | 50GB* |
| AlertManager | 128MB | 0.1 core | 0 |
| Grafana | 256MB | 0.2 core | 1GB |
| Node Exporter | 64MB | 0.1 core | 0 |

*15-day retention. Adjust based on metrics volume.

## Integration with Applications

### Next.js Application (apps/interface)

```typescript
// In your main app file
import { initTelemetry } from './lib/telemetry';

// Initialize telemetry
initTelemetry();

// Wrap async operations
import { withSpan } from './lib/telemetry';

async function handleRequest(req, res) {
  await withSpan('handle-request', async () => {
    // Your handler code
  }, { method: req.method, path: req.path });
}
```

### Node.js Services

```typescript
import { initTelemetry, businessMetrics } from './telemetry';

initTelemetry();

// Record business events
businessMetrics.recordCampaignCreated('campaign-123', 10000);
```

## Maintenance

### Daily
- Monitor alert queue
- Check service health
- Review error rates

### Weekly
- Review storage usage
- Analyze performance trends
- Update alerting thresholds if needed

### Monthly
- Clean up old traces (Jaeger)
- Verify backup retention
- Review and optimize slow queries

## Related Documentation

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/overview/)

## Support

For issues or questions:
1. Check logs: `docker-compose logs <service>`
2. Review configuration files
3. Visit service UIs for status
4. Consult upstream documentation

## License

MIT
