"use client";

import React from "react";
import { FileText, X } from "lucide-react";
import { AutoSaveStatus } from "@/hooks/useAutoSave";

interface AutoSaveRecoveryBannerProps {
  /** Whether unsaved recovery data exists. */
  hasRecovery: boolean;
  /** Current auto-save status. */
  status: AutoSaveStatus;
  /** Last saved timestamp. */
  lastSaved: Date | null;
  /** Called when the user clicks "Restore". */
  onRestore: () => void;
  /** Called when the user dismisses the banner. */
  onDismiss: () => void;
}

function statusLabel(status: AutoSaveStatus, lastSaved: Date | null): string {
  if (status === "saving") return "Saving…";
  if (status === "saved" && lastSaved)
    return `Saved at ${lastSaved.toLocaleTimeString()}`;
  if (status === "error") return "Auto-save failed";
  if (lastSaved) return `Last saved ${lastSaved.toLocaleTimeString()}`;
  return "";
}

/**
 * Banner shown when auto-saved recovery data is available.
 * Also doubles as a subtle status chip when no recovery is pending.
 */
export function AutoSaveRecoveryBanner({
  hasRecovery,
  status,
  lastSaved,
  onRestore,
  onDismiss,
}: AutoSaveRecoveryBannerProps) {
  const label = statusLabel(status, lastSaved);

  if (!hasRecovery && !label) return null;

  return (
    <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
      <FileText size={16} className="text-indigo-500 dark:text-indigo-400 shrink-0" />

      <div className="flex-1 min-w-0">
        {hasRecovery ? (
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            Unsaved changes were found. Restore to continue where you left off.
          </p>
        ) : (
          <p className="text-xs text-indigo-500 dark:text-indigo-400">{label}</p>
        )}
      </div>

      {hasRecovery && (
        <button
          type="button"
          onClick={onRestore}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition whitespace-nowrap"
        >
          Restore
        </button>
      )}

      {label && !hasRecovery && (
        <span
          className={`text-xs font-medium whitespace-nowrap ${
            status === "error"
              ? "text-red-500"
              : status === "saved"
              ? "text-green-500"
              : "text-indigo-400"
          }`}
        >
          {label}
        </span>
      )}

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
      >
        <X size={16} />
      </button>
    </div>
  );
}
