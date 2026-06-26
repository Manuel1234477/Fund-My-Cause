import { PubSub } from "graphql-subscriptions";

/**
 * PubSub service for real-time subscriptions
 * In production, this could use Redis Adapter for multi-instance support
 */
export class PubSubService {
  private pubsub: PubSub;

  constructor() {
    this.pubsub = new PubSub();
  }

  /**
   * Publish an event
   */
  async publish(channel: string, payload: any): Promise<void> {
    try {
      await this.pubsub.publish(channel, payload);
    } catch (error) {
      console.error(`Error publishing to ${channel}:`, error);
    }
  }

  /**
   * Subscribe to a channel
   */
  asyncIterator(channels: string[]) {
    return this.pubsub.asyncIterator(channels);
  }

  /**
   * Get the underlying PubSub instance
   */
  getInstance(): PubSub {
    return this.pubsub;
  }

  /**
   * Close the PubSub service
   */
  async close(): Promise<void> {
    try {
      // Cleanup if needed
      console.log("PubSub service closed");
    } catch (error) {
      console.error("Error closing PubSub:", error);
    }
  }
}

/**
 * Create a singleton PubSub instance
 */
let pubSubInstance: PubSubService | null = null;

export function getPubSub(): PubSubService {
  if (!pubSubInstance) {
    pubSubInstance = new PubSubService();
  }
  return pubSubInstance;
}
