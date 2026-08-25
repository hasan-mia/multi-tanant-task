"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useInView,
  type MotionProps,
  type UseInViewOptions,
  type Variants,
} from "motion/react";

type MarginType = UseInViewOptions["margin"];

interface BlurFadeProps extends MotionProps {
  children: ReactNode;
  className?: string;
  variant?: {
    hidden: { y?: number; x?: number };
    visible: { y?: number; x?: number };
  };
  duration?: number;
  delay?: number;
  offset?: number;
  direction?: "up" | "down" | "left" | "right";
  inView?: boolean;
  inViewMargin?: MarginType;
  blur?: string;
}

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  offset = 6,
  direction = "down",
  inView = false,
  inViewMargin = "-50px",
  blur = "6px",
  ...props
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;

  const isHorizontal = direction === "left" || direction === "right";

  const hidden = isHorizontal
    ? {
        x: direction === "right" ? -offset : offset,
        y: 0,
        opacity: 0,
        filter: `blur(${blur})`,
      }
    : {
        y: direction === "down" ? -offset : offset,
        x: 0,
        opacity: 0,
        filter: `blur(${blur})`,
      };

  const visible = {
    x: 0,
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
  };

  const variants: Variants = {
    hidden,
    visible: variant?.visible ? { ...visible, ...variant.visible } : visible,
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        delay: 0.04 + delay,
        duration,
        ease: "easeOut",
        filter: { duration },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
