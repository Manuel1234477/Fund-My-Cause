// Manual mock for @/context/ThemeContext — returns dark theme by default.
export const ThemeContext = {
  Provider: ({ children }: { children: React.ReactNode }) => children,
};

export function useTheme() {
  return { theme: "dark" as const, toggleTheme: jest.fn() };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement;
}
