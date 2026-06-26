"use client";

import { useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeApplier() {
  const { theme } = useTheme();

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, [theme]);

  return null;
}
