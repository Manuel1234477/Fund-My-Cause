"use client";

import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { isRpcLimited, onConnectivityChange } from "@/lib/rpc-cache";

/**
 * Non-blocking banner that appears when the Soroban RPC is degraded.
 * Subscribes to the rpc-cache connectivity events and disappears automatically
 * once the RPC recovers.
 */
export function LimitedConnectivityBanner() {
  const [limited, setLimited] = useState(isRpcLimited);

  useEffect(() => {
    // Sync initial state (handles SSR/hydration edge)
    setLimited(isRpcLimited());
    return onConnectivityChange(setLimited);
  }, []);

  if (!limited) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300"
    >
      <WifiOff size={16} aria-hidden="true" className="shrink-0" />
      <span>
        <strong>Limited connectivity</strong> — the Stellar RPC is currently
        unavailable. Showing cached data where possible.
      </span>
    </div>
  );
}

/**
 * Inline badge placed next to data values that came from cache during RPC degradation.
 * Renders nothing when connectivity is healthy.
 */
export function StaleBadge({ className = "" }: { className?: string }) {
  const [limited, setLimited] = useState(isRpcLimited);

  useEffect(() => {
    setLimited(isRpcLimited());
    return onConnectivityChange(setLimited);
  }, []);

  if (!limited) return null;

  return (
    <span
      aria-label="Stale data — loaded from cache"
      title="Loaded from cache while RPC is unavailable"
      className={`inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 ${className}`}
    >
      cached
    </span>
  );
}
