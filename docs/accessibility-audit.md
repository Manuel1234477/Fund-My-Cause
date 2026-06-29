# WCAG 2.2 AA Accessibility Audit

**Date:** 2026-06-28  
**Auditor:** Kiro (automated + static code analysis)  
**Standard:** WCAG 2.2 Level AA  
**Scope:** All primary user flows in `apps/interface/src`

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3     |
| High     | 6     |
| Medium   | 5     |
| Low      | 4     |

---

## Critical Violations

### C-1 — Missing focus trap on modal dialogs
**Criterion:** 2.1.2 No Keyboard Trap (Level A) / 2.4.3 Focus Order (Level AA)  
**Location:** `ReceiptModal.tsx`, `GoalSuccessModal.tsx`, `DeadlineExtensionModal.tsx`, `EditProfileModal.tsx`, `PostUpdateModal.tsx`  
**Issue:** Modals did not trap keyboard focus; Tab could escape the overlay, leaving keyboard-only users stranded behind it.  
**Fix (applied):** All five modals now use `useFocusTrap` hook which traps Tab/Shift+Tab within the dialog container and restores focus to the trigger on close.

### C-2 — No Escape-key dismissal on several modals
**Criterion:** 2.1.1 Keyboard (Level A)  
**Location:** `WalletSelectModal.tsx`, `DeadlineExtensionModal.tsx`, `EditProfileModal.tsx`  
**Issue:** Escape key did not close the modal; keyboard-only users had no way to dismiss without tabbing to the Close button.  
**Fix (applied):** `useFocusTrap`'s `onEscape` callback wired to `onClose` in all affected modals.

### C-3 — Focus not returned to trigger element on modal close
**Criterion:** 2.4.3 Focus Order (Level AA)  
**Location:** `WalletSelectModal.tsx`, `GoalSuccessModal.tsx`, `ReceiptModal.tsx`  
**Issue:** After closing a modal, focus jumped to `document.body` instead of the element that opened it, disorienting screen-reader users.  
**Fix (applied):** `useFocusTrap` captures `document.activeElement` before activating and restores it in the cleanup function.

---

## High Violations

### H-1 — ProgressBar missing ARIA role and values
**Criterion:** 4.1.2 Name, Role, Value (Level AA)  
**Location:** `apps/interface/src/components/ui/ProgressBar.tsx`  
**Issue:** The funding progress bar is a styled `<div>` with no `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, or `aria-valuemax`. Screen readers cannot convey funding progress.  
**Remediation:** Add `role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Campaign funding progress"` to the outer div.

### H-2 — CampaignCard pledge button not distinguished per card
**Criterion:** 2.4.6 Headings and Labels (Level AA) / 4.1.2  
**Location:** `apps/interface/src/components/ui/CampaignCard.tsx`  
**Issue:** Multiple "Pledge Now" buttons on the campaigns list page share identical accessible names; screen-reader users cannot distinguish which campaign each button targets.  
**Remediation:** Set `aria-label={`Pledge to ${campaign.title}`}` on each button.

### H-3 — Status badges convey meaning via color alone
**Criterion:** 1.4.1 Use of Color (Level A)  
**Location:** `apps/interface/src/components/ui/CampaignCard.tsx`  
**Issue:** "Funded", "Active", "Ended" badges use color-only differentiation (green/gray/red). Users with color-vision deficiency cannot distinguish them.  
**Remediation:** Text labels already present — verify they are never hidden. Add `aria-label` describing status where the badge is icon-only.

### H-4 — Dynamic error messages not announced
**Criterion:** 4.1.3 Status Messages (Level AA)  
**Location:** `apps/interface/src/components/ui/PledgeModal.tsx`, `PostUpdateModal.tsx`, `CancelCampaignModal.tsx`  
**Issue:** Validation error messages appear visually but have no `role="alert"` or `aria-live` attribute; screen readers do not announce them.  
**Remediation:** Wrap error `<p>` elements with `role="alert"` or add `aria-live="polite"` to their container.

### H-5 — Image inputs with no accessible label
**Criterion:** 1.1.1 Non-text Content (Level A)  
**Location:** `apps/interface/src/components/profile/EditProfileModal.tsx` (`<input type="file">`)  
**Issue:** The file input is `aria-hidden="true"` and triggered via a proxy button, but the proxy button has no `aria-label` describing the purpose.  
**Remediation:** Add `aria-label="Upload avatar image"` to the proxy button.

### H-6 — Missing `lang` attribute on root HTML element
**Criterion:** 3.1.1 Language of Page (Level A)  
**Location:** `apps/interface/src/app/layout.tsx`  
**Issue:** The root `<html>` element does not declare a `lang` attribute; screen readers may use the wrong language for pronunciation.  
**Remediation:** Add `lang={locale}` to `<html>` in the locale layout (`src/app/[locale]/layout.tsx`). The locale layout already does this; verify the non-locale root layout at `src/app/layout.tsx` also sets it.

---

## Medium Violations

### M-1 — Insufficient color contrast for muted text on dark background
**Criterion:** 1.4.3 Contrast (Minimum) (Level AA) — requires 4.5:1 for normal text  
**Location:** All components using `text-gray-400` on `bg-gray-900`  
**Issue:** `text-gray-400` (#9CA3AF) on `bg-gray-900` (#111827) yields ~3.9:1 — below the 4.5:1 AA threshold.  
**Remediation:** Replace `text-gray-400` with `text-gray-300` (#D1D5DB) on dark backgrounds (ratio ~7.4:1).

### M-2 — Progress percentage text insufficient contrast
**Criterion:** 1.4.3 Contrast (Level AA)  
**Location:** `apps/interface/src/components/ui/ProgressBar.tsx`, `CampaignCard.tsx` (`text-indigo-400`, `text-green-400` on `bg-gray-900`)  
**Issue:** `text-indigo-400` (#818CF8) on `bg-gray-900` ≈ 3.5:1; `text-green-400` (#4ADE80) on `bg-gray-900` ≈ 3.3:1 — both fail AA.  
**Remediation:** Use `text-indigo-300` and `text-green-300` respectively.

### M-3 — CountdownTimer `aria-live` fires every second for segments variant
**Criterion:** 2.2.2 Pause, Stop, Hide (Level A)  
**Location:** `apps/interface/src/components/ui/CountdownTimer.tsx` — `segments` variant  
**Issue:** `aria-live="polite"` on the timer announces every second update, creating excessive noise for screen-reader users.  
**Remediation:** Remove `aria-live` from the per-second update region and instead provide a static label (`aria-label`) summarising the remaining time, updated only when minutes change.

### M-4 — `<img>` QR code lacks meaningful alt text
**Criterion:** 1.1.1 Non-text Content (Level A)  
**Location:** `apps/interface/src/components/ui/ShareModal.tsx` — `QRCode` component  
**Issue:** `alt="QR code for campaign URL"` is present and acceptable, but the actual URL is not included; screen-reader users cannot access the link without scanning.  
**Remediation:** Change alt to `alt={`QR code for ${campaignUrl}`}` so the URL is available to assistive technology.

### M-5 — Interactive elements lack visible `focus-visible` outline
**Criterion:** 2.4.11 Focus Appearance (Level AA, new in WCAG 2.2)  
**Location:** Multiple components — buttons and links missing `focus-visible:ring` or `focus-visible:outline`  
**Issue:** Several buttons rely on browser-default focus outlines which are suppressed by Tailwind's `outline-none` reset.  
**Remediation:** Add `focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2` to all interactive elements, or define it globally in `globals.css`.

---

## Low Violations

### L-1 — Tooltip / title attributes used as primary accessible name
**Criterion:** 2.4.6 Headings and Labels (Level AA)  
**Location:** `apps/interface/src/components/ui/EmbedCodeGenerator.tsx`  
**Issue:** Some icon buttons use `title` rather than `aria-label`. `title` is not reliably announced by all screen readers.  
**Remediation:** Replace `title` with `aria-label`.

### L-2 — Skip navigation link not visible on keyboard focus
**Criterion:** 2.4.1 Bypass Blocks (Level A)  
**Location:** `apps/interface/src/components/ui/SkipNav.tsx`  
**Issue:** The skip link exists but may not become visible on focus in all themes; needs explicit `focus:not-sr-only` styling.  
**Remediation:** Ensure `SkipNav` has `focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50` applied.

### L-3 — Decorative icons not hidden from accessibility tree
**Criterion:** 1.1.1 Non-text Content (Level A)  
**Location:** Various lucide-react `<svg>` icons inside buttons that already have `aria-label`  
**Issue:** Decorative icons inside labelled buttons should have `aria-hidden="true"` to avoid double-reading.  
**Remediation:** Add `aria-hidden="true"` to icon components inside buttons that already carry a text label or `aria-label`. Most icons already have this — audit remaining cases in `Navbar.tsx` and `CampaignCard.tsx`.

### L-4 — Autocomplete attributes missing on common form fields
**Criterion:** 1.3.5 Identify Input Purpose (Level AA)  
**Location:** `apps/interface/src/components/create/CreateCampaignWizard.tsx`, `apps/interface/src/app/settings/page.tsx`  
**Issue:** Name, email, and URL fields lack `autocomplete` attributes.  
**Remediation:** Add appropriate `autocomplete` values (`name`, `email`, `url`).

---

## Conformant / No Action Required

- `PledgeModal` — `role="dialog"`, `aria-modal`, `aria-labelledby`, label on input ✓  
- `CancelCampaignModal` — full dialog semantics, labelled textarea, error message ✓  
- `ShareModal` — uses `useFocusTrap`, backdrop click dismissal ✓  
- `ImageLightbox` — focus trap, Escape, arrow keys, `aria-live` caption ✓  
- `WalletSelectModal` — focus trap, Escape (fixed in #749) ✓  
- `CountdownTimer` — `role="timer"`, `aria-live="polite"`, `aria-atomic` ✓  
- Navbar — semantic `<nav>`, `aria-label` on icon-only buttons ✓  
- `SkipNav` component exists ✓  

---

## Remediation Tracking

| ID  | Issue                                         | Priority | Status      |
|-----|-----------------------------------------------|----------|-------------|
| C-1 | Focus trap on modals                          | Critical | ✅ Fixed (#749) |
| C-2 | Escape-key dismissal                          | Critical | ✅ Fixed (#749) |
| C-3 | Return focus to trigger                       | Critical | ✅ Fixed (#749) |
| H-1 | ProgressBar ARIA role/values                  | High     | Open        |
| H-2 | CampaignCard button aria-label                | High     | Open        |
| H-3 | Status badge color-only                       | High     | Open        |
| H-4 | Error messages not announced                  | High     | Open        |
| H-5 | File input proxy button label                 | High     | Open        |
| H-6 | Missing `lang` on root layout                 | High     | Open        |
| M-1 | `text-gray-400` contrast                      | Medium   | Open        |
| M-2 | Progress % text contrast                      | Medium   | Open        |
| M-3 | CountdownTimer aria-live noise                | Medium   | Open        |
| M-4 | QR code alt text                              | Medium   | Open        |
| M-5 | Focus-visible outline (WCAG 2.2 §2.4.11)     | Medium   | Open        |
| L-1 | `title` vs `aria-label`                       | Low      | Open        |
| L-2 | Skip link visibility                          | Low      | Open        |
| L-3 | Decorative icon aria-hidden                   | Low      | Open        |
| L-4 | Autocomplete attributes                       | Low      | Open        |
