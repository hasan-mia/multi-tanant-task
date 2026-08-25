"use client";

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { cn } from "@/lib/utils";
import {
  buttonVariants,
  type ButtonVariantProps,
} from "@/components/ui/button-variants";

type ButtonProps = ButtonPrimitive.Props &
  ButtonVariantProps & {
    asChild?: boolean;
  };

function isNativeButtonElement(
  node: React.ReactElement | undefined,
): boolean {
  if (!node) return true;
  return typeof node.type === "string" && node.type === "button";
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  render,
  nativeButton,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }));

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }>;
    return (
      <ButtonPrimitive
        data-slot="button"
        className={classes}
        render={child}
        nativeButton={nativeButton ?? isNativeButtonElement(child)}
        {...props}
      >
        {child.props.children}
      </ButtonPrimitive>
    );
  }

  const renderElement = React.isValidElement(render) ? render : undefined;

  return (
    <ButtonPrimitive
      data-slot="button"
      className={classes}
      render={render}
      nativeButton={
        nativeButton ??
        (renderElement ? isNativeButtonElement(renderElement) : true)
      }
      {...props}
    >
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
export type { ButtonVariantProps };
