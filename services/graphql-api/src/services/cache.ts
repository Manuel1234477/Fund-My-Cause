import type { RedisClientType } from "redis";

/**
 * Redis cache service for storing and retrieving data with TTL support
 */
export class CacheService {
  constructor(private redis: RedisClientType) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await this.redis.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete specific cache key
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete cache keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      console.error(`Cache pattern delete error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment value (for counters)
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.incrBy(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushDb();
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keyCount: number;
    memoryUsed: string;
    connected: boolean;
  }> {
    try {
      const dbsize = await this.redis.dbSize();
      const info = await this.redis.info("memory");
      const memoryUsed = info
        ?.split("\r\n")
        .find((line) => line.includes("used_memory_human")
        )
        ?.split(":")
        .pop() || "unknown";

      return {
        keyCount: dbsize,
        memoryUsed,
        connected: true,
      };
    } catch (error) {
      console.error("Cache stats error:", error);
      return {
        keyCount: 0,
        memoryUsed: "unknown",
        connected: false,
      };
    }
  }
}
