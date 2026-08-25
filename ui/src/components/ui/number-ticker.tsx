"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { animate, useInView } from "motion/react";

import { cn } from "@/lib/utils";

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number;
  startValue?: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(startValue);
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const started = useRef(false);

  useEffect(() => {
    if (!isInView || started.current) return;
    started.current = true;

    const from = direction === "down" ? value : startValue;
    const to = direction === "down" ? startValue : value;

    const controls = animate(from, to, {
      duration: 1.6,
      delay,
      ease: "easeOut",
      onUpdate: (latest: number) => setDisplay(latest),
    });

    return () => controls.stop();
  }, [isInView, startValue, value, delay, direction]);

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tracking-wider text-black tabular-nums dark:text-white",
        className,
      )}
      {...props}
    >
      {Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(Number(display.toFixed(decimalPlaces)))}
    </span>
  );
}
