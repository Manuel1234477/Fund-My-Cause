# Runbook: ServiceCrashLoop

**Alert:** `ServiceCrashLoop`
**Severity:** critical
**Service:** any
**Dashboard:** [Service Logs](http://grafana:3000/d/service-logs)

## What is happening

A service is logging fatal errors, panics, or unhandled exceptions repeatedly. The process may be crash-looping (exiting and being restarted by Docker / Kubernetes).

## Impact

Depends on the affected service:
- **frontend** — users cannot access the app.
- **indexer** — campaign data is not updated; stale reads.
- **graphql-api** — frontend API calls fail.
- **monitoring-service** — alert delivery may be impaired.

## Diagnosis steps

1. **Identify the service and error:**
   ```
   {service=~".+"} |~ "(?i)(panic|fatal|uncaughtException)"
   ```
2. **Check if the container is restarting:**
   ```bash
   docker ps -a | grep fmc
   # Look for high RESTART count
   ```
3. **Tail the container logs:**
   ```bash
   docker logs --tail 200 <container_name>
   ```
4. **Check system resources:**
   ```bash
   docker stats --no-stream
   free -h
   df -h
   ```
   - Out-of-memory (OOM) kills show as `exit code 137`.
   - Disk full shows as `ENOSPC` in logs.
5. **Review the most recent deploy** — panics are often introduced by new code.

## Remediation

- **OOM kill** — increase the container memory limit or reduce batch sizes in the affected service.
- **Disk full** — clear old Docker images and log files:
  ```bash
  docker system prune -f
  journalctl --vacuum-size=500M
  ```
- **Code panic** — roll back to the previous image:
  ```bash
  docker run --name fmc-stable ... fund-my-cause-frontend:<previous-tag>
  ```
- **Kubernetes crash loop:**
  ```bash
  kubectl rollout undo deployment/<name> -n fund-my-cause
  kubectl rollout status deployment/<name> -n fund-my-cause
  ```

## Escalation

If the service cannot be stabilised within 30 minutes, escalate to the on-call engineer and trigger a P1 incident.

## See also

- [Disaster Recovery](../disaster-recovery.md)
- [Incident Response](../incident-response.md)
