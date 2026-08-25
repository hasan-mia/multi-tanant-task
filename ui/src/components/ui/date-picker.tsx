"use client";

import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({
            variant: "outline",
            className: "w-full justify-start",
          }),
          className,
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
        {value ? format(value, "MMM d, yyyy") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} />
      </PopoverContent>
    </Popover>
  );
}
