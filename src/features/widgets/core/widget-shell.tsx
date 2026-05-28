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
 * - glass surface + border + inner top highlight
 * - header slot (title + toolbar)
 * - entrance animation
 * - consistent padding/radius
 *
 * Does NOT handle drag/resize — that's the Widget *Host*'s job.
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
        "transition-[border-color,background-color,box-shadow]",
        "duration-[var(--duration-base)] [transition-timing-function:var(--ease-standard)]",
        "hover:border-[var(--color-border-strong)]",
        "hover:bg-[var(--color-surface-hi)]",
        className,
      )}
    >
      {(title !== undefined || toolbar !== undefined) && (
        <header
          className={cn(
            "flex items-center justify-between gap-3",
            "px-[var(--density-pad-x)] pt-[var(--density-pad-header-y)] pb-2",
          )}
        >
          {title !== undefined ? (
            <div
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.08em]",
                "text-[var(--color-text-lo)]",
                "transition-colors duration-[var(--duration-base)]",
                "group-hover/widget:text-[var(--color-text-mid)]",
              )}
            >
              {title}
            </div>
          ) : (
            <span aria-hidden />
          )}
          {toolbar !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1",
                // Toolbar fades in on hover/focus to keep cards calm at rest.
                "opacity-60 transition-opacity duration-[var(--duration-base)]",
                "group-hover/widget:opacity-100 group-focus-within/widget:opacity-100",
              )}
            >
              {toolbar}
            </div>
          )}
        </header>
      )}

      <div
        className={cn(
          "flex-1 px-[var(--density-pad-x)] pb-[var(--density-pad-y)] pt-1.5",
          contentClassName,
        )}
      >
        {children}
      </div>
    </motion.section>
  );
}

export const WidgetShell = memo(WidgetShellInner);
