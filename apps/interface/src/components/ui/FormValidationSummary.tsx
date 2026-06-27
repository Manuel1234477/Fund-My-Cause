"use client";

import React, { useEffect, useRef } from "react";

interface FormValidationSummaryProps {
  /** Map of field name → error message. Only entries with truthy values are shown. */
  errors: Partial<Record<string, string>>;
  /** Called when a summary link is clicked; should focus/scroll to the named field. */
  onFieldClick?: (field: string) => void;
  /** Optional heading; defaults to "Please fix the following errors:" */
  heading?: string;
  className?: string;
}

/**
 * Renders an accessible error-summary box at the top of a form.
 *
 * - Lists every current field error as a link.
 * - Clicking a link calls onFieldClick(fieldName) so the caller can focus the input.
 * - Announces itself via an aria-live="assertive" region so screen readers
 *   read the summary immediately when it appears.
 * - Auto-focuses the summary container when errors first appear so keyboard
 *   users land on it.
 */
export function FormValidationSummary({
  errors,
  onFieldClick,
  heading = "Please fix the following errors:",
  className = "",
}: FormValidationSummaryProps) {
  const entries = Object.entries(errors).filter(([, msg]) => Boolean(msg)) as [string, string][];
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Focus the summary whenever new errors appear
  useEffect(() => {
    if (entries.length > 0 && prevCountRef.current === 0) {
      containerRef.current?.focus();
    }
    prevCountRef.current = entries.length;
  }, [entries.length]);

  if (entries.length === 0) return null;

  return (
    <div
      ref={containerRef}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      className={`rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/40 focus:outline-none ${className}`}
    >
      <p className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">
        {heading}
      </p>
      <ul className="space-y-1 list-disc list-inside">
        {entries.map(([field, message]) => (
          <li key={field} className="text-sm text-red-600 dark:text-red-300">
            {onFieldClick ? (
              <button
                type="button"
                onClick={() => onFieldClick(field)}
                className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
              >
                {message}
              </button>
            ) : (
              message
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
