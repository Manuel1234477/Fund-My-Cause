import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";
import type { RedisClientType } from "redis";

/**
 * Rate limiting service with Redis backend
 */
export class RateLimiterService {
  private limiter: RateLimiterRedis | RateLimiterMemory;
  private ipLimiter: RateLimiterRedis | RateLimiterMemory;
  private userLimiter: RateLimiterRedis | RateLimiterMemory;

  constructor(redis?: RedisClientType) {
    if (redis) {
      // Use Redis-based rate limiter for distributed systems
      this.limiter = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:",
        points: 100, // Number of requests
        duration: 60, // Per second (sliding window)
      });

      this.ipLimiter = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl_ip:",
        points: 1000, // Requests per IP
        duration: 3600, // Per hour
      });

      this.userLimiter = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl_user:",
        points: 10000, // Requests per authenticated user
        duration: 3600, // Per hour
      });
    } else {
      // Use in-memory rate limiter for development
      this.limiter = new RateLimiterMemory({
        points: 100,
        duration: 60,
      });

      this.ipLimiter = new RateLimiterMemory({
        points: 1000,
        duration: 3600,
      });

      this.userLimiter = new RateLimiterMemory({
        points: 10000,
        duration: 3600,
      });
    }
  }

  /**
   * Check rate limit for a request
   */
  async checkRequestLimit(key: string): Promise<void> {
    try {
      await this.limiter.consume(key);
    } catch (error: any) {
      if (error.remainingPoints !== undefined) {
        const retryAfter = Math.round(error.msBeforeNext / 1000) || 1;
        const err = new Error("Too many requests");
        (err as any).retryAfter = retryAfter;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Check rate limit by IP address
   */
  async checkIpLimit(ip: string): Promise<void> {
    try {
      await this.ipLimiter.consume(ip);
    } catch (error: any) {
      if (error.remainingPoints !== undefined) {
        const retryAfter = Math.round(error.msBeforeNext / 1000) || 1;
        const err = new Error("IP rate limit exceeded");
        (err as any).retryAfter = retryAfter;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Check rate limit by user address
   */
  async checkUserLimit(address: string): Promise<void> {
    try {
      await this.userLimiter.consume(address);
    } catch (error: any) {
      if (error.remainingPoints !== undefined) {
        const retryAfter = Math.round(error.msBeforeNext / 1000) || 1;
        const err = new Error("User rate limit exceeded");
        (err as any).retryAfter = retryAfter;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Get current rate limit status
   */
  async getStatus(key: string): Promise<{
    limit: number;
    current: number;
    remaining: number;
    resetTime: Date;
  }> {
    try {
      const response = await this.limiter.get(key);

      if (!response) {
        return {
          limit: 100,
          current: 0,
          remaining: 100,
          resetTime: new Date(Date.now() + 60000),
        };
      }

      return {
        limit: 100,
        current: response.consumedPoints,
        remaining: 100 - response.consumedPoints,
        resetTime: new Date(Date.now() + response.msBeforeNext),
      };
    } catch (error) {
      console.error("Error getting rate limit status:", error);
      return {
        limit: 100,
        current: 0,
        remaining: 100,
        resetTime: new Date(Date.now() + 60000),
      };
    }
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    try {
      await this.limiter.delete(key);
    } catch (error) {
      console.error("Error resetting rate limit:", error);
    }
  }
}
