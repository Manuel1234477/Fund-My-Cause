"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

// ── Linear progress bar ───────────────────────────────────────────────────────

export interface ProgressBarProps {
  value?: number;
  indeterminate?: boolean;
  label?: string;
  showPercentage?: boolean;
  animate?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  indeterminate = false,
  label,
  showPercentage = false,
  animate = true,
  className,
  size = "md",
}: ProgressBarProps) {
  const heights = { sm: "h-1", md: "h-2", lg: "h-3" };
  const clampedValue =
    value !== undefined ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div className={cn("w-full", className)}>
      <div
        role="progressbar"
        aria-label={label ?? "Loading"}
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "w-full rounded-full bg-gray-800 overflow-hidden",
          heights[size],
        )}
      >
        {indeterminate ? (
          <div className="h-full w-1/3 bg-[var(--color-brand)] rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" />
        ) : (
          <div
            className={cn(
              "h-full bg-[var(--color-brand)] rounded-full",
              animate && "transition-all duration-500 ease-out",
            )}
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-1">
        {label && <p className="text-xs text-gray-500">{label}</p>}
        {showPercentage && !indeterminate && (
          <p
            className={cn(
              "text-xs font-medium text-[var(--color-brand)] ml-auto",
            )}
            aria-hidden="true"
          >
            {Math.round(clampedValue)}%
          </p>
        )}
      </div>
    </div>
  );
}

// ── Circular progress ─────────────────────────────────────────────────────────

export interface CircularProgressProps {
  value?: number;
  indeterminate?: boolean;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercentage?: boolean;
  animate?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  indeterminate = false,
  size = 40,
  strokeWidth = 4,
  label,
  showPercentage = false,
  animate = true,
  className,
}: CircularProgressProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clampedValue =
    value !== undefined ? Math.min(100, Math.max(0, value)) : 0;
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className={cn("inline-flex items-center justify-center relative", className)}
      role="progressbar"
      aria-label={label ?? "Loading"}
      aria-valuenow={indeterminate ? undefined : clampedValue}
    >
      <svg
        width={size}
        height={size}
        className={indeterminate ? "animate-spin" : ""}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : offset}
          strokeLinecap="round"
          className={cn(
            "text-[var(--color-brand)]",
            animate && "transition-all duration-500 ease-out",
          )}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showPercentage && !indeterminate && (
        <span
          className="absolute text-[var(--color-brand)] font-medium"
          style={{ fontSize: Math.max(8, size * 0.22) }}
          aria-hidden="true"
        >
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}

// ── Loading message ───────────────────────────────────────────────────────────

export interface LoadingMessageProps {
  message?: string;
  subMessage?: string;
  progress?: number;
  indeterminate?: boolean;
  className?: string;
}

export function LoadingMessage({
  message = "Loading…",
  subMessage,
  progress,
  indeterminate = true,
  className,
}: LoadingMessageProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 py-12 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size={32} label={message} />
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-300">{message}</p>
        {subMessage && <p className="text-xs text-gray-500">{subMessage}</p>}
      </div>
      {(progress !== undefined || indeterminate) && (
        <ProgressBar
          value={progress}
          indeterminate={indeterminate && progress === undefined}
          showPercentage={progress !== undefined}
          className="w-48"
          size="sm"
        />
      )}
    </div>
  );
}
