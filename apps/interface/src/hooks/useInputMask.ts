"use client";

import { useCallback } from "react";

export type MaskType = "amount" | "stellarAddress" | "date";

export interface UseMaskResult {
  /** Format the raw value into the display string. */
  format: (raw: string) => string;
  /** Strip mask characters to get the raw value. */
  unformat: (display: string) => string;
  /** Return a validation error for the masked value, or null. */
  validate: (raw: string) => string | null;
}

/** Mask helpers for XLM amount fields (positive decimals, max 7 decimal places). */
function amountMask(): UseMaskResult {
  const format = (raw: string) => {
    if (!raw) return "";
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (parts.length === 1) return integer;
    const decimals = parts[1].slice(0, 7);
    return `${integer}.${decimals}`;
  };

  const unformat = (display: string) => display.replace(/,/g, "");

  const validate = (raw: string): string | null => {
    if (!raw) return null;
    const num = Number(raw.replace(/,/g, ""));
    if (isNaN(num)) return "Enter a valid number.";
    if (num <= 0) return "Amount must be greater than 0.";
    return null;
  };

  return { format, unformat, validate };
}

/** Mask helpers for Stellar addresses (G…/C…/M…, 56 chars, uppercase). */
function stellarAddressMask(): UseMaskResult {
  const format = (raw: string) => raw.toUpperCase().replace(/[^A-Z2-7]/g, "").slice(0, 56);

  const unformat = (display: string) => display;

  const validate = (raw: string): string | null => {
    if (!raw) return null;
    const v = raw.trim();
    if (!/^[GCM][A-Z2-7]{55}$/.test(v)) return "Invalid Stellar address.";
    return null;
  };

  return { format, unformat, validate };
}

/** Mask helpers for date fields (YYYY-MM-DD). */
function dateMask(): UseMaskResult {
  const format = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  };

  const unformat = (display: string) => display;

  const validate = (raw: string): string | null => {
    if (!raw) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "Enter a date in YYYY-MM-DD format.";
    const date = new Date(raw);
    if (isNaN(date.getTime())) return "Enter a valid date.";
    return null;
  };

  return { format, unformat, validate };
}

/**
 * Returns format/unformat/validate helpers for a given mask type.
 * Use in controlled inputs to enforce formatting as the user types.
 *
 * @example
 * const mask = useInputMask("amount");
 * <input value={mask.format(value)} onChange={e => setValue(mask.unformat(e.target.value))} />
 */
export function useInputMask(type: MaskType): UseMaskResult {
  const getMask = useCallback((): UseMaskResult => {
    switch (type) {
      case "amount":
        return amountMask();
      case "stellarAddress":
        return stellarAddressMask();
      case "date":
        return dateMask();
    }
  }, [type]);

  return getMask();
}
