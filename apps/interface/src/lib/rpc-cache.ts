/**
 * In-memory RPC cache for Soroban contract read calls.
 *
 * Two cache tiers:
 *  - TTL cache   — campaign stats / live data, expires after a configurable TTL.
 *  - Static cache — immutable data (goal, deadline, title…), kept indefinitely.
 *
 * Cache keys are `${contractId}:${method}`.
 */

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  staticSize: number;
}

interface CacheEntry {
  value: unknown;
  expiresAt: number; // ms epoch; Infinity for static entries
}

// Default TTL for live campaign data (30 seconds)
export const DEFAULT_TTL_MS = 30_000;

// Contract methods whose return values never change after deployment
const STATIC_METHODS = new Set([
  "goal",
  "deadline",
  "min_contribution",
  "max_contribution",
  "title",
  "description",
  "creator",
  "version",
  "social_links",
]);

const store = new Map<string, CacheEntry>();
let hits = 0;
let misses = 0;

function key(contractId: string, method: string): string {
  return `${contractId}:${method}`;
}

/** Read a cached value. Returns `undefined` on miss or expiry. */
export function cacheGet(
  contractId: string,
  method: string,
): unknown | undefined {
  const entry = store.get(key(contractId, method));
  if (!entry) {
    misses++;
    return undefined;
  }
  if (Date.now() > entry.expiresAt) {
    store.delete(key(contractId, method));
    misses++;
    return undefined;
  }
  hits++;
  return entry.value;
}

/** Store a value. Static methods are cached indefinitely; others use TTL. */
export function cacheSet(
  contractId: string,
  method: string,
  value: unknown,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  const expiresAt = STATIC_METHODS.has(method) ? Infinity : Date.now() + ttlMs;
  store.set(key(contractId, method), { value, expiresAt });
}

/** Remove all entries for a given contract (call after a mutating transaction). */
export function cacheInvalidate(contractId: string): void {
  for (const k of store.keys()) {
    if (k.startsWith(`${contractId}:`)) store.delete(k);
  }
}

/** Remove only TTL (non-static) entries for a contract. */
export function cacheInvalidateLive(contractId: string): void {
  for (const [k, entry] of store.entries()) {
    if (k.startsWith(`${contractId}:`) && entry.expiresAt !== Infinity) {
      store.delete(k);
    }
  }
}

/** Clear the entire cache (useful in tests). */
export function cacheClear(): void {
  store.clear();
  hits = 0;
  misses = 0;
}

/** Return hit/miss counters and current cache size. */
export function cacheStats(): CacheStats {
  let staticSize = 0;
  for (const entry of store.values()) {
    if (entry.expiresAt === Infinity) staticSize++;
  }
  return { hits, misses, size: store.size, staticSize };
}

// ── RPC connectivity / degradation tracking ─────────────────────────────────

/** Number of consecutive RPC failures before the UI considers connectivity limited. */
export const RPC_FAILURE_THRESHOLD = 3;

let consecutiveFailures = 0;
let limitedConnectivity = false;
const connectivityListeners = new Set<(limited: boolean) => void>();

/** Record a successful RPC call. Resets failure counter and clears degraded state. */
export function rpcSuccess(): void {
  consecutiveFailures = 0;
  if (limitedConnectivity) {
    limitedConnectivity = false;
    connectivityListeners.forEach((fn) => fn(false));
  }
}

/** Record a failed RPC call. After RPC_FAILURE_THRESHOLD failures, marks connectivity as limited. */
export function rpcFailure(): void {
  consecutiveFailures++;
  if (!limitedConnectivity && consecutiveFailures >= RPC_FAILURE_THRESHOLD) {
    limitedConnectivity = true;
    connectivityListeners.forEach((fn) => fn(true));
  }
}

/** Returns true when the RPC is currently considered degraded. */
export function isRpcLimited(): boolean {
  return limitedConnectivity;
}

/** Subscribe to connectivity changes. Returns an unsubscribe function. */
export function onConnectivityChange(fn: (limited: boolean) => void): () => void {
  connectivityListeners.add(fn);
  return () => connectivityListeners.delete(fn);
}

/** Reset degradation state (useful in tests). */
export function rpcReset(): void {
  consecutiveFailures = 0;
  limitedConnectivity = false;
}
