# Design System

Fund-My-Cause uses a token-based design system. All visual decisions — colors, typography, spacing, radius, and motion — are defined in one place and consumed everywhere via CSS custom properties.

## Files

| File | Purpose |
|------|---------|
| `src/lib/design-tokens.ts` | TypeScript source of truth for all token values |
| `src/app/globals.css` | CSS custom properties derived from the tokens |

---

## Color Tokens

### Semantic aliases (use these in components)

| CSS variable | Light | Dark | Usage |
|---|---|---|---|
| `--color-background` | `#ffffff` | `#030712` | Page background |
| `--color-surface` | `#f9fafb` | `#111827` | Cards, panels |
| `--color-surface-elevated` | `#f3f4f6` | `#1f2937` | Inputs, skeletons, icon buttons |
| `--color-border` | `#e5e7eb` | `#1f2937` | Dividers, card borders |
| `--color-border-subtle` | `#f3f4f6` | `#374151` | Inner borders |
| `--color-text-primary` | `#111827` | `#f9fafb` | Headings, body copy |
| `--color-text-secondary` | `#6b7280` | `#9ca3af` | Supporting text |
| `--color-text-muted` | `#9ca3af` | `#6b7280` | Placeholders, labels |
| `--color-brand` | `#4f46e5` | `#6366f1` | Primary actions, links |
| `--color-brand-hover` | `#6366f1` | `#818cf8` | Hover state of brand |
| `--color-brand-subtle` | `#e0e7ff` | `#312e81` | Brand tints, badges |
| `--color-success` | `#22c55e` | `#22c55e` | Funded state, success toasts |
| `--color-warning` | `#facc15` | `#facc15` | Network mismatch banner |
| `--color-danger` | `#ef4444` | `#ef4444` | Errors, urgent countdown |
| `--color-danger-subtle` | `#f87171` | `#f87171` | Softer danger text |

### Raw palette (avoid in components — use semantic aliases)

Defined in `design-tokens.ts` under `colors`: `primary`, `success`, `warning`, `danger`, `neutral`.

---

## Typography

| CSS variable | Value |
|---|---|
| `--font-sans` | `Inter, Arial, Helvetica, sans-serif` |
| `--font-mono` | `JetBrains Mono, Fira Code, monospace` |

Scale: `xs` (12px) → `sm` (14px) → `base` (16px) → `lg` (18px) → `xl` (20px) → `2xl` (24px) → `3xl` (30px) → `4xl` (36px).

---

## Border Radius

| CSS variable | Value | Usage |
|---|---|---|
| `--radius-sm` | `0.25rem` | Tiny chips |
| `--radius-md` | `0.5rem` | Small elements |
| `--radius-lg` | `0.75rem` | Medium elements |
| `--radius-xl` | `1rem` | Buttons, inputs |
| `--radius-2xl` | `1.25rem` | Cards |
| `--radius-full` | `9999px` | Pills, badges |

---

## Transitions

| CSS variable | Value | Usage |
|---|---|---|
| `--transition-fast` | `150ms ease` | Micro-interactions |
| `--transition-base` | `200ms ease` | Buttons, inputs |
| `--transition-slow` | `300ms ease` | Theme switch, page transitions |

---

## Utility Classes

Pre-built classes in `globals.css` for the most common patterns:

### `.ds-card`
Surface card with background, border, and `border-radius: var(--radius-2xl)`.

```html
<div class="ds-card p-5">…</div>
```

### `.ds-btn-primary`
Brand-colored button. Add padding and width yourself.

```html
<button class="ds-btn-primary px-4 py-2">Pledge Now</button>
```

### `.ds-btn-ghost`
Muted icon/action button (used for theme toggle, notification bell).

```html
<button class="ds-btn-ghost p-2">…</button>
```

### `.ds-input`
Styled text input with focus ring.

```html
<input class="ds-input w-full px-4 py-2" />
```

---

## Usage in Components

Always reference tokens via CSS variables, not raw Tailwind color classes:

```tsx
// ✅ correct — adapts to light/dark automatically
<p className="text-[var(--color-text-secondary)]">…</p>
<div className="bg-[var(--color-surface)] border border-[var(--color-border)]">…</div>

// ❌ avoid — hardcoded, breaks in light mode
<p className="text-gray-400">…</p>
<div className="bg-gray-900 border-gray-800">…</div>
```

For inline styles (e.g. dynamic widths with token colors):

```tsx
<div style={{ background: "var(--color-brand)", width: `${pct}%` }} />
```

---

## Theme Switching

The `ThemeContext` toggles the `.light` class on `<html>`. All CSS variables are scoped to `:root` (dark default) and `.light` (light overrides), so the entire UI re-themes with zero JavaScript color logic in components.

---

## Adding New Tokens

1. Add the value to `src/lib/design-tokens.ts`.
2. Add the corresponding `--variable` to both `:root` and `.light` in `globals.css`.
3. Use `var(--your-token)` in components.

Do **not** add one-off hardcoded colors to components. If a color is needed more than once, it belongs in the token system.
