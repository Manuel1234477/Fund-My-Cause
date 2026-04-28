"use client";

import React from "react";

export function LoadingSkeleton() {
  return (
    <div className="ds-card animate-pulse">
      <div className="w-full h-48 bg-[var(--color-surface-elevated)]" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-[var(--color-surface-elevated)] rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-full" />
          <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-5/6" />
        </div>
        <div className="h-2 bg-[var(--color-surface-elevated)] rounded-full" />
        <div className="flex justify-between">
          <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-1/3" />
          <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-1/4" />
        </div>
        <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-1/2" />
        <div className="h-9 bg-[var(--color-surface-elevated)] rounded-xl" />
      </div>
    </div>
  );
}

export function LoadingSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} />
      ))}
    </div>
  );
}
