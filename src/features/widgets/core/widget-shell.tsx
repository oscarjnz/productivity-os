"use client";

import { memo, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { fadeUp } from "@/config/motion";

interface WidgetShellProps {
  title?: ReactNode;
  toolbar?: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Stagger delay in seconds for entrance. */
  delay?: number;
  children: ReactNode;
}

/**
 * Visual container for every widget. Provides:
 * - glass surface + border
 * - header slot (title + toolbar)
 * - entrance animation
 * - consistent padding/radius
 *
 * Does NOT handle drag/resize — that's the Widget *Host*'s job (Phase 2).
 */
function WidgetShellInner({
  title,
  toolbar,
  className,
  contentClassName,
  delay = 0,
  children,
}: WidgetShellProps) {
  return (
    <motion.section
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay }}
      className={cn(
        "group/widget relative flex flex-col overflow-hidden",
        "rounded-[var(--radius-lg)] glass",
        "shadow-[var(--shadow-md)]",
        "transition-[border-color,background-color] duration-[var(--duration-fast)]",
        "[transition-timing-function:var(--ease-standard)]",
        "hover:border-[var(--color-border-strong)]",
        className,
      )}
    >
      {(title !== undefined || toolbar !== undefined) && (
        <header
          className={cn(
            "flex items-center justify-between gap-3",
            "px-5 pt-4 pb-2",
          )}
        >
          {title !== undefined && (
            <div
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.07em]",
                "text-[var(--color-text-lo)]",
              )}
            >
              {title}
            </div>
          )}
          {toolbar !== undefined && (
            <div className="flex items-center gap-1.5">{toolbar}</div>
          )}
        </header>
      )}

      <div className={cn("flex-1 px-5 pb-5 pt-2", contentClassName)}>{children}</div>
    </motion.section>
  );
}

export const WidgetShell = memo(WidgetShellInner);
