"use client";

import type { ComponentProps } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const STATUS_SWITCH_CLASS =
  "data-checked:bg-emerald-600 data-unchecked:bg-zinc-300 dark:data-unchecked:bg-zinc-600";

/**
 * Compact emerald switch used for Active / Public style toggles in tables and drawers.
 */
export function StatusSwitch({
  className,
  size = "sm",
  ...props
}: ComponentProps<typeof Switch>) {
  return (
    <Switch
      size={size}
      className={cn(STATUS_SWITCH_CLASS, className)}
      {...props}
    />
  );
}
