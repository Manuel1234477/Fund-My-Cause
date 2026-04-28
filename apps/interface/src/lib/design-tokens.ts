/**
 * Design tokens for Fund-My-Cause.
 *
 * These values are the single source of truth. They are mirrored as CSS custom
 * properties in globals.css so they are available to Tailwind utilities and
 * plain CSS alike.
 */

// ── Colors ────────────────────────────────────────────────────────────────────

export const colors = {
  // Brand / primary (indigo)
  primary: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
  },

  // Success (green)
  success: {
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
  },

  // Warning (yellow/amber)
  warning: {
    300: "#fde047",
    400: "#facc15",
    800: "#854d0e",
    900: "#713f12",
  },

  // Danger (red)
  danger: {
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
  },

  // Neutral (gray)
  neutral: {
    0: "#ffffff",
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    850: "#18212f",
    900: "#111827",
    950: "#030712",
  },
} as const;

// ── Typography ────────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    sans: ["Inter", "Arial", "Helvetica", "sans-serif"],
    mono: ["JetBrains Mono", "Fira Code", "monospace"],
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────────

export const spacing = {
  0: "0px",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

// ── Border radius ─────────────────────────────────────────────────────────────

export const radius = {
  none: "0px",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  full: "9999px",
} as const;

// ── Shadows ───────────────────────────────────────────────────────────────────

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  card: "0 8px 32px rgba(0,0,0,0.25)",
} as const;

// ── Transitions ───────────────────────────────────────────────────────────────

export const transitions = {
  fast: "150ms ease",
  base: "200ms ease",
  slow: "300ms ease",
} as const;

// ── Semantic aliases (light / dark) ───────────────────────────────────────────
// These map to CSS custom properties defined in globals.css.

export const semanticTokens = {
  light: {
    background: colors.neutral[0],
    surface: colors.neutral[50],
    surfaceElevated: colors.neutral[100],
    border: colors.neutral[200],
    borderSubtle: colors.neutral[100],
    textPrimary: colors.neutral[900],
    textSecondary: colors.neutral[500],
    textMuted: colors.neutral[400],
    brand: colors.primary[600],
    brandHover: colors.primary[500],
    brandSubtle: colors.primary[100],
  },
  dark: {
    background: colors.neutral[950],
    surface: colors.neutral[900],
    surfaceElevated: colors.neutral[800],
    border: colors.neutral[800],
    borderSubtle: colors.neutral[700],
    textPrimary: colors.neutral[50],
    textSecondary: colors.neutral[400],
    textMuted: colors.neutral[500],
    brand: colors.primary[500],
    brandHover: colors.primary[400],
    brandSubtle: colors.primary[900],
  },
} as const;
