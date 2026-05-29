"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export interface UseInfiniteScrollReturn {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useInfiniteScroll(
  loadMore: () => Promise<void>,
  hasMore: boolean,
  options: UseInfiniteScrollOptions = {},
): UseInfiniteScrollReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  const load = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      await loadMore();
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [loadMore, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          load();
        }
      },
      {
        threshold: options.threshold ?? 0.1,
        rootMargin: options.rootMargin ?? "100px",
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [load, options.threshold, options.rootMargin]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
    isLoadingRef.current = false;
  }, []);

  return { sentinelRef, isLoading, error, reset };
}
