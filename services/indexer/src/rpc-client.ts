import { rpc } from "@stellar/stellar-sdk";
import pino from "pino";

export interface SorobanRPCConfig {
  url: string;
  contractId: string;
}

export interface IndexerEvent {
  id: string;
  timestamp: number;
  type: string;
  contractId: string;
  data: Record<string, unknown>;
}

export class SorobanRPCClient {
  private server: rpc.Server;
  private logger: pino.Logger;
  private config: SorobanRPCConfig;
  private lastLedger: number = 0;

  constructor(config: SorobanRPCConfig, logger: pino.Logger) {
    this.config = config;
    this.logger = logger;
    this.server = new rpc.Server(config.url);
  }

  /**
   * Connect to Soroban RPC and verify connectivity
   */
  async connect(): Promise<boolean> {
    try {
      const status = await this.server.getLatestLedger();
      this.lastLedger = status.sequence;
      this.logger.info(
        { ledger: this.lastLedger },
        "Connected to Soroban RPC"
      );
      return true;
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Failed to connect to Soroban RPC"
      );
      return false;
    }
  }

  /**
   * Stream contract events starting from lastLedger
   * Yields events as they are discovered
   */
  async* streamEvents(): AsyncGenerator<IndexerEvent[]> {
    let currentLedger = this.lastLedger;

    while (true) {
      try {
        const events = await this.fetchEvents(currentLedger);

        if (events.length > 0) {
          this.logger.debug(
            { ledger: currentLedger, eventCount: events.length },
            "Fetched events"
          );
          yield events;
        }

        // Move to next ledger
        currentLedger += 1;
        this.lastLedger = currentLedger;

        // Poll interval: 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        this.logger.error(
          { error: error instanceof Error ? error.message : String(error) },
          "Error streaming events"
        );
        // Retry after 10 seconds
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  /**
   * Fetch contract events for a specific ledger sequence
   */
  private async fetchEvents(ledgerSequence: number): Promise<IndexerEvent[]> {
    try {
      // Query events using Soroban RPC
      // This is a placeholder - actual implementation depends on RPC version
      const response = await fetch(`${this.config.url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getEvents",
          params: {
            startLedger: ledgerSequence,
            filters: [
              {
                type: "contract",
                contractIds: [this.config.contractId],
              },
            ],
          },
        }),
      });

      const data = (await response.json()) as {
        result?: { events: unknown[] };
        error?: { message: string };
      };

      if (data.error) {
        throw new Error(`RPC error: ${data.error.message}`);
      }

      const events = data.result?.events ?? [];
      return events.map((e: unknown) => this.parseEvent(e));
    } catch (error) {
      this.logger.warn(
        { ledger: ledgerSequence, error: error instanceof Error ? error.message : String(error) },
        "Failed to fetch events for ledger"
      );
      return [];
    }
  }

  /**
   * Parse raw RPC event into IndexerEvent
   */
  private parseEvent(rawEvent: unknown): IndexerEvent {
    const event = rawEvent as Record<string, unknown>;
    return {
      id: `${event.id}`,
      timestamp: (event.timestamp as number) ?? Date.now(),
      type: `${event.type}`,
      contractId: `${event.contractId}`,
      data: (event.data as Record<string, unknown>) ?? {},
    };
  }
}
