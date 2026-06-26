# Monitoring and Alerting Setup

## Overview

This setup includes Prometheus for metrics collection, Grafana for visualization, and AlertManager for alert routing.

## Components

### Prometheus
- Scrapes metrics from Kubernetes API, nodes, pods, and application endpoints
- Stores metrics with 30-day retention
- Evaluates alerting rules every 30 seconds

### Grafana
- Visualizes Prometheus metrics
- Pre-configured with Prometheus datasource
- Default credentials: admin/admin123

### AlertManager
- Routes alerts based on severity
- Sends notifications to Slack
- Inhibits lower severity alerts when critical alerts exist

## Installation

```bash
# Deploy monitoring stack
kubectl apply -f k8s/prometheus-config.yaml
kubectl apply -f k8s/prometheus-rules.yaml
kubectl apply -f k8s/prometheus.yaml
kubectl apply -f k8s/grafana.yaml
kubectl apply -f k8s/alertmanager.yaml
```

## Configuration

### Slack Integration

Update AlertManager config with your Slack webhook:

```bash
kubectl edit configmap alertmanager-config -n fund-my-cause
```

Replace `YOUR_SLACK_WEBHOOK_URL` with your actual webhook URL.

### Grafana Admin Password

Change the default password:

```bash
kubectl edit secret grafana-admin -n fund-my-cause
```

## Accessing Services

### Prometheus
```bash
kubectl port-forward -n fund-my-cause svc/prometheus 9090:9090
# Access at http://localhost:9090
```

### Grafana
```bash
kubectl port-forward -n fund-my-cause svc/grafana 3000:3000
# Access at http://localhost:3000
```

### AlertManager
```bash
kubectl port-forward -n fund-my-cause svc/alertmanager 9093:9093
# Access at http://localhost:9093
```

## Alert Rules

Current alerts configured:
- **HighErrorRate**: HTTP error rate > 5% for 5 minutes
- **PodCrashLooping**: Pod restart rate > 0.1 per 15 minutes
- **HighMemoryUsage**: Container memory > 90% of limit
- **HighCPUUsage**: Container CPU > 80% for 5 minutes
- **PodNotReady**: Pod in Pending/Unknown/Failed state for 10 minutes
- **DeploymentReplicasMismatch**: Deployment has unavailable replicas
- **ContractCallFailure**: Contract call failure rate > 10%
- **RPCLatencyHigh**: 95th percentile RPC latency > 2 seconds

## Metrics Collection

Prometheus scrapes:
- Kubernetes API servers
- Kubernetes nodes
- Kubernetes pods (with `prometheus.io/scrape: true` annotation)
- Fund-My-Cause frontend application

## Retention

- Metrics retained for 30 days
- Adjust with `--storage.tsdb.retention.time` flag in prometheus.yaml

## Scaling

For high-volume metrics:
- Increase Prometheus memory/CPU limits
- Use persistent volumes for storage
- Consider Prometheus federation for multi-cluster setup
