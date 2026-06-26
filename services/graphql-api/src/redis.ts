import { createClient } from "redis";
import type { RedisClientType } from "redis";

/**
 * Create and connect to Redis client
 */
export async function createRedisClient(): Promise<RedisClientType> {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  const client = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error("Max Redis reconnection attempts reached");
          return new Error("Max retries reached");
        }
        return retries * 100;
      },
    },
  });

  client.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  client.on("connect", () => {
    console.log("Redis Client Connected");
  });

  client.on("ready", () => {
    console.log("Redis Client Ready");
  });

  client.on("reconnecting", () => {
    console.log("Redis Client Reconnecting");
  });

  await client.connect();

  return client as RedisClientType;
}
