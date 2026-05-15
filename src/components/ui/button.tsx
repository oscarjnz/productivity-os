"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md font-medium select-none",
    "transition-[background-color,border-color,color,transform] duration-[var(--duration-fast)]",
    "[transition-timing-function:var(--ease-standard)]",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]",
  ),
  {
    variants: {
      variant: {
        primary: cn(
          "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
          "border border-[oklch(0.68_0.18_270/0.2)]",
          "hover:bg-[oklch(0.68_0.18_270/0.18)] hover:border-[oklch(0.68_0.18_270/0.3)]",
        ),
        secondary: cn(
          "bg-[var(--color-bg-raised)] text-[var(--color-text-hi)]",
          "border border-[var(--color-border)]",
          "hover:bg-[var(--color-bg-overlay)] hover:border-[var(--color-border-strong)]",
        ),
        ghost: cn(
          "bg-transparent text-[var(--color-text-mid)]",
          "border border-transparent",
          "hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-hi)]",
        ),
        outline: cn(
          "bg-transparent text-[var(--color-text-mid)]",
          "border border-[var(--color-border)]",
          "hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-hi)]",
        ),
        danger: cn(
          "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
          "border border-[oklch(0.65_0.22_25/0.2)]",
          "hover:bg-[oklch(0.65_0.22_25/0.2)]",
        ),
      },
      size: {
        xs: "h-7 px-2.5 text-[12px]",
        sm: "h-8 px-3 text-[12.5px]",
        md: "h-9 px-3.5 text-[13px]",
        lg: "h-10 px-4 text-sm",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  );
});

export { buttonVariants };
