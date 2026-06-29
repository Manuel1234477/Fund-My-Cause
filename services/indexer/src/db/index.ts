import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { createLogger } from '../logger.js';

const logger = createLogger('database');

/** Queries slower than this (ms) are logged as warnings. Configurable via env. */
const SLOW_QUERY_MS = parseInt(process.env.SLOW_QUERY_MS ?? '100', 10);

/** In-memory latency stats reset on process restart. */
interface QueryStats {
  totalQueries: number;
  slowQueries: number;
  /** Most recent slow queries (capped at 50). */
  recentSlowQueries: Array<{ text: string; durationMs: number; ts: number }>;
}

const stats: QueryStats = {
  totalQueries: 0,
  slowQueries: 0,
  recentSlowQueries: [],
};

/** Returns a snapshot of current query performance stats. */
export function getQueryStats(): Readonly<QueryStats> {
  return { ...stats, recentSlowQueries: [...stats.recentSlowQueries] };
}

let pool: Pool;

export function initializePool(connectionString: string): Pool {
  pool = new Pool({ connectionString });
  logger.info('Database pool initialized');
  return pool;
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializePool first.');
  }
  return pool;
}

/**
 * Executes a query and logs a warning when it exceeds SLOW_QUERY_MS.
 * All callers should use this wrapper instead of pool.query() directly so
 * every query is counted and slow queries are surfaced.
 */
export async function query<R extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<QueryResult<R>> {
  const start = performance.now();
  try {
    const result = await pool.query<R>(text, values);
    return result;
  } finally {
    const durationMs = performance.now() - start;
    stats.totalQueries += 1;

    if (durationMs >= SLOW_QUERY_MS) {
      stats.slowQueries += 1;
      const truncated = text.length > 200 ? `${text.slice(0, 200)}…` : text;
      logger.warn({ durationMs: Math.round(durationMs), query: truncated }, 'Slow query detected');

      stats.recentSlowQueries.unshift({
        text: truncated,
        durationMs: Math.round(durationMs),
        ts: Date.now(),
      });
      // Keep only the 50 most recent slow queries
      if (stats.recentSlowQueries.length > 50) {
        stats.recentSlowQueries.length = 50;
      }
    }
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
}
