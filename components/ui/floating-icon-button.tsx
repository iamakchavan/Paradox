"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const FloatingIconButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(({ className, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      "liquid-glass-dock inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/60 hover:text-foreground active:scale-[0.93] active:duration-75 motion-reduce:transform-none",
      className
    )}
    {...props}
  />
));

FloatingIconButton.displayName = "FloatingIconButton";
