"use client";

import type { MatchLineups, TeamLineup } from "../types";
import { cn } from "@/lib/utils/cn";

interface LineupsProps {
  lineups: MatchLineups;
  homeName: string;
  awayName: string;
}

export function Lineups({ lineups, homeName, awayName }: LineupsProps) {
  return (
    <div className="flex flex-col gap-3 px-3 py-2">
      <TeamBlock team={lineups.home} name={homeName} accent />
      <div className="divider" />
      <TeamBlock team={lineups.away} name={awayName} />
    </div>
  );
}

function TeamBlock({
  team,
  name,
  accent,
}: {
  team: TeamLineup;
  name: string;
  accent?: boolean;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "min-w-0 truncate text-[12px] font-semibold",
            accent ? "text-[var(--color-accent)]" : "text-[var(--color-text-hi)]",
          )}
        >
          {name}
        </span>
        {team.formation && (
          <span className="shrink-0 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-1.5 py-0.5 text-[10px] font-semibold tabular text-[var(--color-text-mid)]">
            {team.formation}
          </span>
        )}
      </div>

      <ul className="flex flex-col">
        {team.startXI.map((p, i) => (
          <li
            key={`${p.name}-${i}`}
            className="flex items-center gap-2 rounded-[var(--radius-xs)] px-1 py-1 hover:bg-[var(--color-bg-raised)]"
          >
            <span className="w-5 shrink-0 text-center text-[10.5px] tabular text-[var(--color-text-lo)]">
              {p.number ?? "—"}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--color-text-hi)]">
              {p.name}
            </span>
            {p.pos && (
              <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-lo)]">
                {p.pos}
              </span>
            )}
          </li>
        ))}
      </ul>

      {team.subs.length > 0 && (
        <details className="group/subs mt-0.5">
          <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]">
            Suplentes · {team.subs.length}
          </summary>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {team.subs.map((p, i) => (
              <li key={`${p.name}-${i}`} className="text-[11px] text-[var(--color-text-mid)]">
                <span className="tabular text-[var(--color-text-lo)]">{p.number ?? "—"}</span>{" "}
                {p.name}
              </li>
            ))}
          </ul>
        </details>
      )}

      {team.coach && (
        <div className="text-[10.5px] text-[var(--color-text-lo)]">
          DT · {team.coach}
        </div>
      )}
    </section>
  );
}
