"use client";

import React from "react";
import { Undo2, Redo2 } from "lucide-react";

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  className?: string;
}

/**
 * Undo / Redo button pair.
 * Keyboard shortcuts (Ctrl+Z / Ctrl+Y) are handled by useUndoRedo directly.
 */
export function UndoRedoControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  className = "",
}: UndoRedoControlsProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo (Ctrl+Z)"
        title="Undo (Ctrl+Z)"
        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none transition"
      >
        <Undo2 size={15} />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo (Ctrl+Y)"
        title="Redo (Ctrl+Y)"
        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none transition"
      >
        <Redo2 size={15} />
      </button>
    </div>
  );
}
