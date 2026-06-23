"use client";

import { useMemo, useState } from "react";
import type { SportsConfig, SportsView } from "../config";
import type { SportsEvent } from "../types";
import { MatchRow } from "../components/match-row";
import { MatchDrawer } from "../components/match-drawer";
import { ViewFilter } from "../components/view-filter";
import { applyViewFilter } from "../lib/filter";

interface ListProps {
  events: SportsEvent[];
  config: SportsConfig;
  onChange: (next: SportsConfig) => void;
}

export function ListVariant({ events, config, onChange }: ListProps) {
  const [openEvent, setOpenEvent] = useState<SportsEvent | null>(null);
  const view = config.view;

  const filtered = useMemo(
    () => applyViewFilter(events, view),
    [events, view],
  );

  const favSet = useMemo(() => new Set(config.teams), [config.teams]);

  return (
    <div className="flex h-full flex-col gap-2">
      <ViewFilter
        value={view}
        onChange={(v: SportsView) => onChange({ ...config, view: v })}
      />
      <div className="-mr-1 flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[11.5px] text-[var(--color-text-lo)]">
            Sin partidos para este filtro
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {filtered.slice(0, 12).map((ev) => (
              <li key={ev.id}>
                <MatchRow
                  event={ev}
                  favoriteTeamIds={favSet}
                  onClick={setOpenEvent}
                  compact
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <MatchDrawer event={openEvent} onClose={() => setOpenEvent(null)} />
    </div>
  );
}
