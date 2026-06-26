# Log Aggregation with ELK Stack

## Overview

The ELK (Elasticsearch, Logstash, Kibana) stack provides centralized log aggregation, parsing, and visualization for Fund-My-Cause.

## Components

### Elasticsearch
- Stores and indexes logs
- Provides full-text search capabilities
- Retention: Configurable via index lifecycle management

### Logstash
- Collects logs from multiple sources
- Parses and enriches log data
- Routes logs to Elasticsearch with appropriate indices

### Kibana
- Web UI for log visualization
- Create dashboards and alerts
- Query and analyze logs

### Filebeat
- Lightweight log shipper running on each node
- Collects container logs
- Forwards logs to Logstash

## Installation

```bash
# Deploy ELK stack
kubectl apply -f k8s/elasticsearch.yaml
kubectl apply -f k8s/logstash.yaml
kubectl apply -f k8s/kibana.yaml
kubectl apply -f k8s/filebeat.yaml
```

## Configuration

### Log Parsing

Logstash automatically parses logs based on type:
- `kube-logs`: Kubernetes system logs → `k8s-logs-YYYY.MM.dd`
- `app-logs`: Application logs → `app-logs-YYYY.MM.dd`
- `contract-logs`: Smart contract logs → `contract-logs-YYYY.MM.dd`

### Log Retention

Configure retention in Elasticsearch:

```bash
# Set 30-day retention
curl -X PUT "elasticsearch:9200/_ilm/policy/logs-policy" -H 'Content-Type: application/json' -d'{
  "policy": "logs-policy",
  "phases": {
    "hot": {
      "min_age": "0ms",
      "actions": {
        "rollover": {
          "max_primary_store_size": "50gb"
        }
      }
    },
    "delete": {
      "min_age": "30d",
      "actions": {
        "delete": {}
      }
    }
  }
}'
```

## Accessing Services

### Kibana
```bash
kubectl port-forward -n fund-my-cause svc/kibana 5601:5601
# Access at http://localhost:5601
```

### Elasticsearch
```bash
kubectl port-forward -n fund-my-cause svc/elasticsearch 9200:9200
# Access at http://localhost:9200
```

### Logstash
```bash
kubectl port-forward -n fund-my-cause svc/logstash 5000:5000
# Send logs to localhost:5000
```

## Sending Logs

### From Application

Send JSON logs to Logstash:

```bash
echo '{"message":"test","type":"app-logs","timestamp":"2024-01-01T00:00:00Z"}' | \
  nc -w 1 logstash 5000
```

### From Kubernetes Pod

Add annotation to pod for log collection:

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    logs.fund-my-cause/collect: "true"
```

## Kibana Dashboards

### Create Dashboard

1. Open Kibana at http://localhost:5601
2. Go to Dashboards → Create Dashboard
3. Add visualizations:
   - Log volume over time
   - Error rate by service
   - Top error messages
   - Request latency distribution

### Sample Queries

```
# All errors
level: "error"

# Contract call failures
type: "contract-logs" AND status: "failed"

# High latency requests
latency_ms: [1000 TO *]

# Specific service
service: "fund-my-cause-frontend"
```

## Log Parsing Examples

### JSON Logs
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "info",
  "message": "Campaign created",
  "campaign_id": "123",
  "creator": "user@example.com"
}
```

### Structured Logs
```
[2024-01-01 00:00:00] INFO: Campaign created - campaign_id=123 creator=user@example.com
```

## Performance Tuning

### Elasticsearch
- Increase heap size for large log volumes
- Use SSD storage for better performance
- Configure index sharding for parallel processing

### Logstash
- Increase worker threads for high throughput
- Use batch processing for better performance
- Monitor queue depth

### Kibana
- Cache frequently used dashboards
- Limit time range for queries
- Use filters to reduce data scanned

## Troubleshooting

### Logs not appearing in Kibana

1. Check Filebeat status:
```bash
kubectl logs -n fund-my-cause -l app=filebeat
```

2. Check Logstash status:
```bash
kubectl logs -n fund-my-cause -l app=logstash
```

3. Verify Elasticsearch connectivity:
```bash
kubectl exec -n fund-my-cause elasticsearch-pod -- \
  curl -s http://localhost:9200/_cluster/health | jq '.'
```

### High memory usage

1. Reduce Elasticsearch heap size
2. Implement index lifecycle management
3. Delete old indices

### Slow queries

1. Add index aliases for faster queries
2. Use filters instead of queries
3. Limit time range

## Backup and Recovery

Backup Elasticsearch indices:

```bash
# Create snapshot repository
curl -X PUT "elasticsearch:9200/_snapshot/backup" -H 'Content-Type: application/json' -d'{
  "type": "fs",
  "settings": {
    "location": "/backup"
  }
}'

# Create snapshot
curl -X PUT "elasticsearch:9200/_snapshot/backup/snapshot-1"
```

Restore from snapshot:

```bash
curl -X POST "elasticsearch:9200/_snapshot/backup/snapshot-1/_restore"
```

## Security

### Enable Authentication

```bash
# Set Elasticsearch password
kubectl set env deployment/elasticsearch \
  -n fund-my-cause \
  ELASTIC_PASSWORD=secure_password
```

### Enable TLS

```bash
# Generate certificates
elasticsearch-certutil ca
elasticsearch-certutil cert --ca-cert ca.crt --ca-key ca.key

# Mount certificates in deployment
```

## Monitoring

Monitor ELK stack health:

```bash
# Elasticsearch cluster health
curl http://elasticsearch:9200/_cluster/health

# Index statistics
curl http://elasticsearch:9200/_stats

# Logstash pipeline status
curl http://logstash:9600/_node/stats/pipelines
```
