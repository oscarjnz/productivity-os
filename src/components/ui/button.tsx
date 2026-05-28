"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[var(--radius-md)] font-medium select-none",
    // Motion: tint, transform, shadow all share the same fast curve.
    "transition-[background-color,border-color,color,transform,box-shadow]",
    "duration-[var(--duration-fast)] [transition-timing-function:var(--ease-standard)]",
    "will-change-transform",
    "active:scale-[0.98] active:translate-y-0",
    "disabled:pointer-events-none disabled:opacity-45 disabled:saturate-50",
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
    "focus-visible:ring-offset-[var(--color-bg-base)]",
  ),
  {
    variants: {
      variant: {
        // Primary lifts subtly on hover; accent-driven border + bg.
        primary: cn(
          "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
          "border border-[var(--color-accent-border)]",
          "shadow-[inset_0_1px_0_oklch(1_0_0_/_0.05)]",
          "hover:bg-[var(--color-accent-soft-hi)]",
          "hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-sm)]",
        ),
        secondary: cn(
          "bg-[var(--color-bg-raised)] text-[var(--color-text-hi)]",
          "border border-[var(--color-border)]",
          "shadow-[inset_0_1px_0_oklch(1_0_0_/_0.03)]",
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
          "hover:bg-[var(--color-surface-glass)]",
          "hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-hi)]",
        ),
        danger: cn(
          "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
          "border border-[var(--color-danger-border)]",
          "hover:bg-[var(--color-danger-soft-hi)]",
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
