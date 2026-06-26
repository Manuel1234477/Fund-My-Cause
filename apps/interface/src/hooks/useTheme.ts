import { useAppDispatch, useAppSelector, selectTheme } from "@/store/hooks";
import {
  setTheme as setThemeAction,
  toggleTheme as toggleThemeAction,
} from "@/store/slices/themeSlice";
import { useEffect } from "react";

type Theme = "dark" | "light";

export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      dispatch(setThemeAction(savedTheme));
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      dispatch(setThemeAction("light"));
    }
  }, [dispatch]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    dispatch(toggleThemeAction());
  };

  return { theme, toggleTheme };
}
