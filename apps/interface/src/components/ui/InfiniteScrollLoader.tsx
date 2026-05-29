"use client";

import React from "react";
import { Spinner } from "./Spinner";

interface InfiniteScrollLoaderProps {
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  onRetry?: () => void;
}

export function InfiniteScrollLoader({
  isLoading,
  error,
  hasMore,
  onRetry,
}: InfiniteScrollLoaderProps) {
  if (error) {
    return (
      <div
        className="flex flex-col items-center gap-2 py-6 text-center"
        role="alert"
      >
        <p className="text-sm text-[var(--color-danger-subtle)]">
          {error.message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-[var(--color-brand)] hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex justify-center py-6"
        role="status"
        aria-label="Loading more"
      >
        <Spinner size={24} label="Loading more" />
      </div>
    );
  }

  if (!hasMore) {
    return (
      <p className="text-center text-xs text-[var(--color-text-muted)] py-4">
        No more items
      </p>
    );
  }

  return null;
}
