"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface UseUndoRedoReturn<T> {
  /** Current state value. */
  state: T;
  /** Push a new state onto the history stack. */
  set: (next: T | ((prev: T) => T)) => void;
  /** Step back one entry in history. */
  undo: () => void;
  /** Step forward one entry in history. */
  redo: () => void;
  /** Whether undo is available. */
  canUndo: boolean;
  /** Whether redo is available. */
  canRedo: boolean;
  /** Clear history and reset to the given state (or the initial value). */
  reset: (next?: T) => void;
}

/**
 * Tracks a bounded history of state snapshots and exposes undo/redo.
 * Also registers Ctrl+Z (undo) and Ctrl+Y / Ctrl+Shift+Z (redo) keyboard shortcuts.
 *
 * @param initialState - initial value
 * @param maxHistory   - maximum snapshots to retain (default: 50)
 *
 * @example
 * const { state, set, undo, redo, canUndo, canRedo } = useUndoRedo(initialFormData);
 */
export function useUndoRedo<T>(
  initialState: T,
  maxHistory = 50,
): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [cursor, setCursor] = useState(0);

  // Keep a ref so keyboard handlers always see the latest cursor without
  // being re-registered every render.
  const cursorRef = useRef(cursor);
  const historyRef = useRef(history);
  cursorRef.current = cursor;
  historyRef.current = history;

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setHistory((prev) => {
      const current = prev[cursorRef.current];
      const nextValue = typeof next === "function" ? (next as (p: T) => T)(current) : next;

      // Truncate any redo-future and append new state.
      const truncated = prev.slice(0, cursorRef.current + 1);
      const updated = [...truncated, nextValue];

      // Enforce cap.
      const capped = updated.length > maxHistory ? updated.slice(updated.length - maxHistory) : updated;
      const newCursor = capped.length - 1;
      setCursor(newCursor);
      cursorRef.current = newCursor;
      historyRef.current = capped;
      return capped;
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setCursor((c) => {
      const next = Math.max(0, c - 1);
      cursorRef.current = next;
      return next;
    });
  }, []);

  const redo = useCallback(() => {
    setCursor((c) => {
      const next = Math.min(historyRef.current.length - 1, c + 1);
      cursorRef.current = next;
      return next;
    });
  }, []);

  const reset = useCallback(
    (next?: T) => {
      const value = next !== undefined ? next : initialState;
      setHistory([value]);
      setCursor(0);
      cursorRef.current = 0;
      historyRef.current = [value];
    },
    [initialState],
  );

  // Global keyboard shortcuts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const next = Math.max(0, cursorRef.current - 1);
        cursorRef.current = next;
        setCursor(next);
      } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        const next = Math.min(historyRef.current.length - 1, cursorRef.current + 1);
        cursorRef.current = next;
        setCursor(next);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return {
    state: history[cursor],
    set,
    undo,
    redo,
    canUndo: cursor > 0,
    canRedo: cursor < history.length - 1,
    reset,
  };
}
