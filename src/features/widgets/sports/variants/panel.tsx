"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { SportsConfig } from "../config";
import { SPORT_EMOJI, SPORT_LABELS } from "../config";
import type { SportKey, SportsEvent } from "../types";
import { MatchRow } from "../components/match-row";
import { MatchDrawer } from "../components/match-drawer";
import { ViewFilter } from "../components/view-filter";
import { applyViewFilter } from "../lib/filter";
import { cn } from "@/lib/utils/cn";

interface PanelProps {
  events: SportsEvent[];
  config: SportsConfig;
  onChange: (next: SportsConfig) => void;
}

export function PanelVariant({ events, config, onChange }: PanelProps) {
  const [activeSport, setActiveSport] = useState<SportKey | "all">("all");
  const [query, setQuery] = useState("");
  const [openEvent, setOpenEvent] = useState<SportsEvent | null>(null);

  const availableSports = useMemo<SportKey[]>(() => {
    const set = new Set<SportKey>();
    for (const e of events) set.add(e.sport);
    return Array.from(set);
  }, [events]);

  const filtered = useMemo(() => {
    const bySport = activeSport === "all"
      ? events
      : events.filter((e) => e.sport === activeSport);
    const byView = applyViewFilter(bySport, config.view);
    if (!query.trim()) return byView;
    const q = query.toLowerCase();
    return byView.filter((e) =>
      e.home.name.toLowerCase().includes(q) ||
      e.away.name.toLowerCase().includes(q) ||
      e.league.name.toLowerCase().includes(q),
    );
  }, [events, activeSport, config.view, query]);

  const favSet = useMemo(() => new Set(config.teams), [config.teams]);

  // Group by league for the panel view
  const grouped = useMemo(() => {
    const map = new Map<string, { league: SportsEvent["league"]; events: SportsEvent[] }>();
    for (const e of filtered) {
      const existing = map.get(e.league.id);
      if (existing) existing.events.push(e);
      else map.set(e.league.id, { league: e.league, events: [e] });
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--color-text-lo)]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar equipo o liga…"
            className={cn(
              "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-base)]",
              "py-1 pl-7 pr-2 text-[12px] text-[var(--color-text-hi)] outline-none",
              "placeholder:text-[var(--color-text-lo)] focus:border-[var(--color-accent)]",
            )}
          />
        </div>
        <ViewFilter
          value={config.view}
          onChange={(view) => onChange({ ...config, view })}
        />
      </div>

      {/* Sport tabs */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SportChip
          active={activeSport === "all"}
          onClick={() => setActiveSport("all")}
          label="Todos"
        />
        {availableSports.map((s) => (
          <SportChip
            key={s}
            active={activeSport === s}
            onClick={() => setActiveSport(s)}
            label={`${SPORT_EMOJI[s]} ${SPORT_LABELS[s]}`}
          />
        ))}
      </div>

      {/* Body */}
      <div className="-mr-1 flex-1 overflow-y-auto pr-1">
        {grouped.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[11.5px] text-[var(--color-text-lo)]">
            Sin partidos para este filtro
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {grouped.map(({ league, events: leagueEvents }) => (
              <section key={league.id}>
                <div className="mb-1 flex items-center gap-1.5 px-1">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
                    {league.name}
                  </span>
                  {league.country && (
                    <span className="text-[9px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]/70">
                      · {league.country}
                    </span>
                  )}
                </div>
                <ul className="flex flex-col gap-0.5">
                  {leagueEvents.map((ev) => (
                    <li key={ev.id}>
                      <MatchRow
                        event={ev}
                        favoriteTeamIds={favSet}
                        onClick={setOpenEvent}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <MatchDrawer event={openEvent} onClose={() => setOpenEvent(null)} />
    </div>
  );
}

function SportChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-medium",
        "border transition-colors duration-[var(--duration-fast)]",
        active
          ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
          : "border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-mid)] hover:text-[var(--color-text-hi)]",
      )}
    >
      {label}
    </button>
  );
}
