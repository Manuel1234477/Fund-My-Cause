"use client";

import React from "react";
import { Save, CheckCircle2, AlertCircle, Clock, HelpCircle } from "lucide-react";
import type { DraftSaveStatus } from "@/hooks/useCampaignDraft";

interface DraftIndicatorProps {
  saveStatus: DraftSaveStatus;
  lastSaved: Date | null;
  onSave: () => void;
  onResolveConflict?: (resolution: "keep-local" | "keep-remote") => void;
}

/**
 * Shows the current draft save status and provides a manual save button.
 */
export function DraftIndicator({
  saveStatus,
  lastSaved,
  onSave,
  onResolveConflict,
}: DraftIndicatorProps) {
  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status indicator */}
      <span className="flex items-center gap-1.5 text-xs">
        {saveStatus === "saving" && (
          <>
            <Clock size={12} className="text-gray-400 animate-pulse" />
            <span className="text-gray-400">Saving…</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <CheckCircle2 size={12} className="text-green-500" />
            <span className="text-green-600 dark:text-green-400">
              Draft saved
            </span>
          </>
        )}
        {saveStatus === "error" && (
          <>
            <AlertCircle size={12} className="text-red-500" />
            <span className="text-red-500 dark:text-red-400">Save failed</span>
          </>
        )}
        {saveStatus === "conflict" && (
          <>
            <HelpCircle size={12} className="text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Conflict: Edited in another tab
            </span>
          </>
        )}
        {saveStatus === "idle" && lastSaved && (
          <>
            <CheckCircle2 size={12} className="text-gray-400" />
            <span className="text-gray-400">
              Saved at {formatTime(lastSaved)}
            </span>
          </>
        )}
      </span>

      {/* Conflict Resolution Actions */}
      {saveStatus === "conflict" && onResolveConflict && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onResolveConflict("keep-local")}
            className="px-2 py-1 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded hover:bg-amber-200 transition"
          >
            Keep this version
          </button>
          <button
            type="button"
            onClick={() => onResolveConflict("keep-remote")}
            className="px-2 py-1 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 transition"
          >
            Use latest from other tab
          </button>
        </div>
      )}

      {/* Manual save button */}
      <button
        type="button"
        onClick={onSave}
        disabled={saveStatus === "saving" || saveStatus === "conflict"}
        aria-label="Save draft"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400
          hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white
          disabled:opacity-50 transition"
      >
        <Save size={12} />
        Save draft
      </button>
    </div>
  );
}
