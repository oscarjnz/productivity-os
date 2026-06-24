"use client";

import type { MatchStat } from "../types";

interface MatchStatsProps {
  stats: MatchStat[];
}

function toNumber(v: string | number | null): number | null {
  if (v === null) return null;
  if (typeof v === "number") return v;
  const n = Number.parseFloat(v.replace("%", "").trim());
  return Number.isFinite(n) ? n : null;
}

function display(v: string | number | null): string {
  if (v === null || v === "") return "—";
  return String(v);
}

export function MatchStats({ stats }: MatchStatsProps) {
  return (
    <div className="flex flex-col gap-2.5 px-3 py-2">
      {stats.map((s, i) => {
        const h = toNumber(s.home);
        const a = toNumber(s.away);
        const total = (h ?? 0) + (a ?? 0);
        const hasBar = h !== null && a !== null && total > 0;
        const homePct = hasBar ? (h! / total) * 100 : 50;
        return (
          <div key={`${s.label}-${i}`} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="w-10 shrink-0 tabular font-semibold text-[var(--color-text-hi)]">
                {display(s.home)}
              </span>
              <span className="min-w-0 flex-1 truncate text-center text-[10.5px] text-[var(--color-text-lo)]">
                {s.label}
              </span>
              <span className="w-10 shrink-0 text-right tabular font-semibold text-[var(--color-text-hi)]">
                {display(s.away)}
              </span>
            </div>
            <div className="flex h-1 overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className="h-full rounded-l-full bg-[var(--color-accent)] transition-[width] duration-[var(--duration-slow)]"
                style={{ width: `${homePct}%` }}
              />
              <div
                className="h-full rounded-r-full bg-[var(--color-text-lo)]"
                style={{ width: `${100 - homePct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
