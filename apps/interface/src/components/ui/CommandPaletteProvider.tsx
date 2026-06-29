"use client";

import { useState, useEffect, useCallback } from "react";
import { CommandPalette } from "./CommandPalette";
import { KeyboardShortcutsOverlay } from "./KeyboardShortcutsOverlay";

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const togglePalette = useCallback(() => {
    setIsPaletteOpen((prev) => !prev);
  }, []);

  const closePalette = useCallback(() => {
    setIsPaletteOpen(false);
  }, []);

  const closeShortcuts = useCallback(() => {
    setIsShortcutsOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in an input / textarea / contenteditable
      const target = e.target as HTMLElement;
      const isEditable =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Cmd+K or Ctrl+K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
        return;
      }

      // ? → keyboard shortcuts overlay (only when not typing)
      if (!isEditable && e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePalette]);

  return (
    <>
      {children}
      <CommandPalette isOpen={isPaletteOpen} onClose={closePalette} />
      <KeyboardShortcutsOverlay
        isOpen={isShortcutsOpen}
        onClose={closeShortcuts}
      />
    </>
  );
}
