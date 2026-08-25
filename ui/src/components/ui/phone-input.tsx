"use client";

import PhoneInputBase, {
  type Country,
  type Value,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

type PhoneInputProps = {
  value?: Value | string;
  onChange?: (value?: Value) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  defaultCountry?: Country;
  international?: boolean;
};

/**
 * Country-code phone picker styled like `Input` (full width, h-8).
 */
export function PhoneInput({
  className,
  value,
  onChange,
  onBlur,
  defaultCountry = "BD",
  international = true,
  ...props
}: PhoneInputProps) {
  return (
    <PhoneInputBase
      {...props}
      international={international}
      countryCallingCodeEditable={false}
      defaultCountry={defaultCountry}
      flags={flags}
      value={(value as Value | undefined) || undefined}
      onChange={(next) => onChange?.(next || undefined)}
      onBlur={onBlur}
      className={cn("PhoneInputField h-8", className)}
    />
  );
}

export type { Country, Value as PhoneValue };
