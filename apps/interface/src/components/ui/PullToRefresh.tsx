"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}

const THRESHOLD = 72;
const MAX_PULL = 120;

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = THRESHOLD,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const triggerHaptic = useCallback(() => {
    if ("vibrate" in navigator) navigator.vibrate(10);
  }, []);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (startYRef.current === null || refreshing) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) return;
      e.preventDefault();
      const clamped = Math.min(delta * 0.5, MAX_PULL);
      setPullDistance(clamped);
      if (clamped >= threshold) triggerHaptic();
    },
    [refreshing, threshold, triggerHaptic],
  );

  const onTouchEnd = useCallback(async () => {
    if (startYRef.current === null) return;
    startYRef.current = null;
    if (pullDistance >= threshold) {
      setRefreshing(true);
      setPullDistance(threshold);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 0 || refreshing;

  return (
    <div ref={containerRef} className={cn("relative overflow-auto", className)}>
      {showIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex justify-center z-10 transition-all duration-200"
          style={{ height: refreshing ? threshold : pullDistance }}
        >
          <div className="flex items-center justify-center">
            <svg
              className={cn(
                "w-6 h-6 text-[var(--color-brand)]",
                refreshing && "animate-spin",
              )}
              style={
                !refreshing
                  ? { transform: `rotate(${progress * 180}deg)` }
                  : undefined
              }
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              {refreshing ? (
                <path
                  strokeLinecap="round"
                  d="M12 2a10 10 0 1 0 10 10"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              )}
            </svg>
          </div>
        </div>
      )}
      <div
        style={{
          transform: `translateY(${refreshing ? threshold : pullDistance}px)`,
          transition: startYRef.current === null ? "transform 0.3s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
