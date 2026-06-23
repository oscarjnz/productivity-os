"use client";

import { cn } from "@/lib/utils/cn";
import type { SportsView } from "../config";

const OPTIONS: ReadonlyArray<{ value: SportsView; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "live", label: "Live" },
  { value: "today", label: "Hoy" },
  { value: "tomorrow", label: "Mañana" },
];

interface ViewFilterProps {
  value: SportsView;
  onChange: (next: SportsView) => void;
}

export function ViewFilter({ value, onChange }: ViewFilterProps) {
  return (
    <div
      role="tablist"
      className="grid gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-base)] p-0.5"
      style={{ gridTemplateColumns: `repeat(${OPTIONS.length}, minmax(0, 1fr))` }}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-[var(--radius-xs)] py-1 text-[10.5px] font-medium",
              "transition-colors duration-[var(--duration-fast)]",
              active
                ? "bg-[var(--color-bg-overlay)] text-[var(--color-text-hi)]"
                : "text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]",
            )}
          >
            {opt.label}
            {opt.value === "live" && active && (
              <span className="ml-1 inline-block h-1 w-1 rounded-full bg-[var(--color-danger)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
