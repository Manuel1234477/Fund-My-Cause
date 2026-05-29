/**
 * Comprehensive form validation utilities.
 * Provides field-level validators, form-level validation, and error message helpers.
 */

export type FieldValidator<T = string> = (value: T, context?: Record<string, unknown>) => string | null;

export interface FieldValidationResult {
  valid: boolean;
  error: string | null;
}

export interface FormValidationResult<T extends Record<string, unknown>> {
  valid: boolean;
  errors: Partial<Record<keyof T, string>>;
  firstError: string | null;
}

/** Run a single validator and return a structured result. */
export function validateField<T = string>(
  value: T,
  validators: FieldValidator<T>[],
  context?: Record<string, unknown>,
): FieldValidationResult {
  for (const validator of validators) {
    const error = validator(value, context);
    if (error) return { valid: false, error };
  }
  return { valid: true, error: null };
}

/** Run a map of field validators over a form values object. */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  schema: Partial<Record<keyof T, FieldValidator[]>>,
): FormValidationResult<T> {
  const errors: Partial<Record<keyof T, string>> = {};
  let firstError: string | null = null;

  for (const key in schema) {
    const fieldValidators = schema[key];
    if (!fieldValidators) continue;
    const value = values[key] as unknown;
    for (const validator of fieldValidators) {
      const error = validator(value as string);
      if (error) {
        errors[key] = error;
        if (!firstError) firstError = error;
        break;
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, firstError };
}

// ── Built-in field validators ───────────────────────────────────────────────

export const required =
  (message = "This field is required."): FieldValidator =>
  (value) =>
    !value || !String(value).trim() ? message : null;

export const minLength =
  (min: number, message?: string): FieldValidator =>
  (value) =>
    String(value).trim().length < min
      ? (message ?? `Must be at least ${min} characters.`)
      : null;

export const maxLength =
  (max: number, message?: string): FieldValidator =>
  (value) =>
    String(value).trim().length > max
      ? (message ?? `Must be ${max} characters or less.`)
      : null;

export const isNumber =
  (message = "Must be a valid number."): FieldValidator =>
  (value) =>
    isNaN(Number(value)) ? message : null;

export const minValue =
  (min: number, message?: string): FieldValidator =>
  (value) =>
    Number(value) < min ? (message ?? `Must be at least ${min}.`) : null;

export const maxValue =
  (max: number, message?: string): FieldValidator =>
  (value) =>
    Number(value) > max ? (message ?? `Must be at most ${max}.`) : null;

export const pattern =
  (regex: RegExp, message: string): FieldValidator =>
  (value) =>
    !regex.test(String(value)) ? message : null;

export const httpsUrl =
  (message = "Must be a valid https:// URL."): FieldValidator =>
  (value) => {
    if (!value || !String(value).trim()) return null;
    try {
      const url = new URL(String(value));
      return url.protocol === "https:" ? null : message;
    } catch {
      return message;
    }
  };

export const stellarAddress =
  (message = "Must be a valid Stellar address (G…, C…, or M…)."): FieldValidator =>
  (value) => {
    if (!value || !String(value).trim()) return null;
    const v = String(value).trim();
    return /^[GCM][A-Z2-7]{54,55}$/.test(v) ? null : message;
  };

export const futureDate =
  (minHours = 1, message?: string): FieldValidator =>
  (value) => {
    if (!value) return "Date is required.";
    const date = new Date(String(value));
    const diffHours = (date.getTime() - Date.now()) / 3_600_000;
    return diffHours < minHours
      ? (message ?? `Date must be at least ${minHours} hour(s) in the future.`)
      : null;
  };

export const pastDate =
  (message = "Date must be in the past."): FieldValidator =>
  (value) => {
    if (!value) return "Date is required.";
    return new Date(String(value)).getTime() > Date.now() ? message : null;
  };

/** Cross-field validator: ensures fieldA <= fieldB numerically. */
export function lessThanOrEqual(
  a: string,
  b: string,
  message: string,
): string | null {
  return Number(a) > Number(b) ? message : null;
}
