import pino from "pino";

/**
 * Health check for the indexer service
 */
export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  lastEventTime: number;
  lastLedger: number;
  eventsProcessed: number;
}

export class HealthChecker {
  private startTime: number;
  private lastEventTime: number = 0;
  private lastLedger: number = 0;
  private eventsProcessed: number = 0;
  private logger: pino.Logger;

  constructor(logger: pino.Logger) {
    this.logger = logger;
    this.startTime = Date.now();
  }

  /**
   * Update health metrics when processing events
   */
  recordEvent(ledger: number): void {
    this.lastEventTime = Date.now();
    this.lastLedger = Math.max(this.lastLedger, ledger);
    this.eventsProcessed += 1;
  }

  /**
   * Get current health status
   */
  getStatus(): HealthStatus {
    const uptime = Date.now() - this.startTime;
    const isHealthy = this.eventsProcessed > 0 && Date.now() - this.lastEventTime < 60000;
    const isDegraded = this.eventsProcessed > 0 && Date.now() - this.lastEventTime < 120000;

    const status = isHealthy ? "healthy" : isDegraded ? "degraded" : "unhealthy";

    return {
      status,
      uptime,
      lastEventTime: this.lastEventTime,
      lastLedger: this.lastLedger,
      eventsProcessed: this.eventsProcessed,
    };
  }

  /**
   * Log current health status
   */
  logStatus(): void {
    const status = this.getStatus();
    this.logger.info(status, `Health check: ${status.status}`);
  }
}
