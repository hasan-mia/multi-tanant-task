"use client";

import { useEffect, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type { DateRange };

function hasBothEnds(range?: DateRange) {
  return Boolean(range?.from && range?.to);
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  className,
  numberOfMonths = 2,
  align = "end",
}: {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  numberOfMonths?: number;
  align?: "start" | "center" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(value);

  useEffect(() => {
    if (!open) setDraft(value);
  }, [value, open]);

  const display = open ? draft : value;
  const hasValue = hasBothEnds(value);
  const canClear = Boolean(draft?.from || value?.from);

  const label =
    display?.from && display?.to
      ? `${format(display.from, "MMM d, yyyy")} – ${format(display.to, "MMM d, yyyy")}`
      : display?.from
        ? `${format(display.from, "MMM d, yyyy")} – …`
        : placeholder;

  function clearRange() {
    setDraft(undefined);
    onChange(undefined);
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Discard incomplete picks — never auto-set to = from.
      setDraft(hasBothEnds(value) ? value : undefined);
    } else {
      setDraft(value);
    }
    setOpen(next);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(
          buttonVariants({
            variant: "outline",
            className: "justify-start text-left font-normal",
          }),
          "min-w-56 gap-2",
          !hasValue && !open && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="range"
          // Without min>0, react-day-picker sets { from, to: sameDay } on first click.
          min={1}
          required={false}
          numberOfMonths={numberOfMonths}
          defaultMonth={draft?.from ?? value?.from}
          selected={draft}
          onSelect={(range) => {
            setDraft(range);
            if (hasBothEnds(range)) {
              onChange(range);
              return;
            }
            if (!range?.from) {
              onChange(undefined);
            }
          }}
        />
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {draft?.from && draft?.to
              ? "Range selected"
              : draft?.from
                ? "Select end date"
                : "Select start and end dates"}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canClear}
            onClick={clearRange}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
