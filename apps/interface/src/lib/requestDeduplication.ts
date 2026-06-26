/**
 * Request deduplication with automatic caching and batching.
 * Prevents duplicate in-flight requests and caches results.
 */

interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();
const cache = new Map<string, { value: unknown; expiresAt: number }>();

const DEFAULT_CACHE_TTL = 60_000; // 1 minute

/**
 * Generate a cache key from request parameters.
 */
function generateKey(
  endpoint: string,
  params?: Record<string, unknown>,
): string {
  const paramStr = params ? JSON.stringify(params) : "";
  return `${endpoint}:${paramStr}`;
}

/**
 * Deduplicate and cache API requests.
 * If a request is already in-flight, return the existing promise.
 * If cached and not expired, return cached value.
 */
export async function deduplicatedFetch<T>(
  endpoint: string,
  params?: Record<string, unknown>,
  cacheTtl: number = DEFAULT_CACHE_TTL,
): Promise<T> {
  const key = generateKey(endpoint, params);

  // Check cache first
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value as T;
  }

  // Check if request is already in-flight
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending.promise as Promise<T>;
  }

  // Create new request
  const promise = fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params || {}),
  })
    .then((res) => res.json())
    .then((data) => {
      cache.set(key, { value: data, expiresAt: Date.now() + cacheTtl });
      pendingRequests.delete(key);
      return data as T;
    })
    .catch((error) => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, { promise, timestamp: Date.now() });
  return promise as Promise<T>;
}

/**
 * Invalidate cache entry.
 */
export function invalidateCache(
  endpoint: string,
  params?: Record<string, unknown>,
): void {
  const key = generateKey(endpoint, params);
  cache.delete(key);
}

/**
 * Clear all caches and pending requests.
 */
export function clearDeduplicationCache(): void {
  cache.clear();
  pendingRequests.clear();
}

/**
 * Get deduplication stats.
 */
export function getDeduplicationStats() {
  return {
    cachedRequests: cache.size,
    pendingRequests: pendingRequests.size,
  };
}
