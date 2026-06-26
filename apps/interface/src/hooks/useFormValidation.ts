"use client";

import { useState, useCallback } from "react";
import {
  FieldValidator,
  FormValidationResult,
  validateForm,
} from "@/lib/formValidation";

type Schema<T extends Record<string, unknown>> = Partial<Record<keyof T, FieldValidator[]>>;

interface UseFormValidationReturn<T extends Record<string, unknown>> {
  /** Per-field error messages. */
  errors: Partial<Record<keyof T, string>>;
  /** True when all validated fields pass. */
  isValid: boolean;
  /** First error message across all fields (useful for a summary banner). */
  firstError: string | null;
  /** Validate all fields and update error state. Returns true if valid. */
  validate: (values: T) => boolean;
  /** Validate a single field and update its error. Returns the error or null. */
  validateOne: (field: keyof T, value: unknown) => string | null;
  /** Clear error for a specific field. */
  clearError: (field: keyof T) => void;
  /** Clear all errors. */
  clearAll: () => void;
}

/**
 * Manages form validation state.
 * Supports field-level and form-level validation with per-field error messages.
 *
 * @example
 * const schema = { title: [required(), maxLength(100)], goal: [required(), isNumber()] };
 * const { errors, validate, validateOne } = useFormValidation(schema);
 */
export function useFormValidation<T extends Record<string, unknown>>(
  schema: Schema<T>,
): UseFormValidationReturn<T> {
  const [result, setResult] = useState<FormValidationResult<T>>({
    valid: true,
    errors: {},
    firstError: null,
  });

  const validate = useCallback(
    (values: T): boolean => {
      const r = validateForm(values, schema);
      setResult(r);
      return r.valid;
    },
    [schema],
  );

  const validateOne = useCallback(
    (field: keyof T, value: unknown): string | null => {
      const fieldValidators = schema[field];
      if (!fieldValidators) return null;
      let error: string | null = null;
      for (const v of fieldValidators) {
        error = v(value as string);
        if (error) break;
      }
      setResult((prev) => {
        const errors = { ...prev.errors };
        if (error) {
          errors[field] = error;
        } else {
          delete errors[field];
        }
        const firstError = Object.values(errors).find(Boolean) as string | null ?? null;
        return { valid: Object.keys(errors).length === 0, errors, firstError };
      });
      return error;
    },
    [schema],
  );

  const clearError = useCallback((field: keyof T) => {
    setResult((prev) => {
      const errors = { ...prev.errors };
      delete errors[field];
      const firstError = Object.values(errors).find(Boolean) as string | null ?? null;
      return { valid: Object.keys(errors).length === 0, errors, firstError };
    });
  }, []);

  const clearAll = useCallback(() => {
    setResult({ valid: true, errors: {}, firstError: null });
  }, []);

  return {
    errors: result.errors,
    isValid: result.valid,
    firstError: result.firstError,
    validate,
    validateOne,
    clearError,
    clearAll,
  };
}
