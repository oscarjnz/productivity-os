"use client";

import { Goal, RectangleVertical, ArrowLeftRight, MonitorPlay, Circle } from "lucide-react";
import type { TimelineEvent } from "../types";
import { cn } from "@/lib/utils/cn";

interface TimelineProps {
  events: TimelineEvent[];
}

function iconFor(e: TimelineEvent) {
  switch (e.type) {
    case "goal":
      return <Goal className="h-3.5 w-3.5" aria-hidden />;
    case "card":
      return (
        <RectangleVertical
          className={cn(
            "h-3.5 w-3.5",
            e.detail.toLowerCase().includes("red")
              ? "fill-[var(--color-danger)] text-[var(--color-danger)]"
              : "fill-[var(--color-warning)] text-[var(--color-warning)]",
          )}
          aria-hidden
        />
      );
    case "subst":
      return <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />;
    case "var":
      return <MonitorPlay className="h-3.5 w-3.5" aria-hidden />;
    default:
      return <Circle className="h-2.5 w-2.5" aria-hidden />;
  }
}

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-[11px] text-[var(--color-text-lo)]">
        Sin eventos registrados todavía
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-0.5 px-1 py-1">
      {events.map((e, i) => {
        const home = e.side === "home";
        return (
          <li
            key={`${e.minute}-${i}`}
            className="flex items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--color-bg-raised)]"
          >
            <span className="w-8 shrink-0 pt-0.5 text-right text-[10.5px] tabular text-[var(--color-text-lo)]">
              {e.minute}
            </span>
            <span
              className={cn(
                "mt-0.5 shrink-0",
                e.type === "goal"
                  ? home
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-text-hi)]"
                  : "text-[var(--color-text-lo)]",
              )}
            >
              {iconFor(e)}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[11.5px] font-medium text-[var(--color-text-hi)]">
                {e.player ?? e.detail}
              </span>
              <span className="truncate text-[10.5px] text-[var(--color-text-lo)]">
                {e.type === "subst" && e.assist
                  ? `↑ ${e.assist}`
                  : e.assist
                    ? `Asist. ${e.assist}`
                    : e.detail}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
