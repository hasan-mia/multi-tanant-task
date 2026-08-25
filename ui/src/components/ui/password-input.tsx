"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type PasswordInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  describedBy?: string;
  className?: string;
};

/**
 * Password field with show/hide toggle, matching shared Input height.
 */
export function PasswordInput({
  value = "",
  onChange,
  onBlur,
  name,
  id,
  placeholder = "••••••••",
  disabled,
  autoComplete = "new-password",
  describedBy,
  className,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <InputGroup className={cn("w-full", className)}>
      <InputGroupInput
        id={id}
        type={show ? "text" : "password"}
        name={name}
        value={value}
        disabled={disabled}
        onBlur={onBlur}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-sm"
          disabled={disabled}
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((current) => !current)}
        >
          {show ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
