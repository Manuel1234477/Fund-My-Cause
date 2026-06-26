"use client";

import { useState, useEffect, useCallback } from "react";
import { CommandPalette } from "./CommandPalette";
import { useWallet } from "@/context/WalletContext";

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const togglePalette = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePalette]);

  return (
    <>
      {children}
      <CommandPalette isOpen={isOpen} onClose={closePalette} />
    </>
  );
}
