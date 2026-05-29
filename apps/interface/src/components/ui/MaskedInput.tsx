"use client";

import React, { useState } from "react";
import { useInputMask, MaskType } from "@/hooks/useInputMask";

interface MaskedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  maskType: MaskType;
  value: string;
  onChange: (raw: string) => void;
  /** Show inline validation feedback below the input. */
  showValidation?: boolean;
}

/**
 * Controlled input with built-in formatting and validation feedback.
 * Delegates masking logic to useInputMask.
 */
export function MaskedInput({
  maskType,
  value,
  onChange,
  showValidation = true,
  className,
  ...rest
}: MaskedInputProps) {
  const mask = useInputMask(maskType);
  const [touched, setTouched] = useState(false);
  const error = touched ? mask.validate(value) : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = mask.unformat(e.target.value);
    onChange(raw);
  };

  return (
    <div>
      <input
        {...rest}
        value={mask.format(value)}
        onChange={handleChange}
        onBlur={() => setTouched(true)}
        aria-invalid={!!error}
        className={className}
      />
      {showValidation && error && (
        <p className="text-red-500 dark:text-red-400 text-xs mt-1" role="alert">
          {error}
        </p>
      )}
      {showValidation && !error && touched && value && (
        <p className="text-green-500 dark:text-green-400 text-xs mt-1">Looks good</p>
      )}
    </div>
  );
}
