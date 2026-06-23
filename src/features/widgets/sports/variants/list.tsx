"use client";

import { useMemo, useState } from "react";
import type { SportsConfig, SportsView } from "../config";
import type { SportsEvent } from "../types";
import { MatchRow } from "../components/match-row";
import { MatchDrawer } from "../components/match-drawer";
import { ViewFilter } from "../components/view-filter";
import { StatusBar } from "../components/status-bar";
import { applyViewFilter } from "../lib/filter";

interface ListProps {
  events: SportsEvent[];
  config: SportsConfig;
  onChange: (next: SportsConfig) => void;
  isFetching: boolean;
  fetchedAt: number;
  onRefresh: () => void;
}

export function ListVariant({
  events,
  config,
  onChange,
  isFetching,
  fetchedAt,
  onRefresh,
}: ListProps) {
  const [openEvent, setOpenEvent] = useState<SportsEvent | null>(null);
  const view = config.view;

  const filtered = useMemo(
    () => applyViewFilter(events, view),
    [events, view],
  );

  const favSet = useMemo(() => new Set(config.teams), [config.teams]);
  const liveCount = events.filter((e) => e.status === "live").length;

  return (
    <div className="flex h-full flex-col gap-1.5">
      <StatusBar
        isFetching={isFetching}
        fetchedAt={fetchedAt}
        liveCount={liveCount}
        totalCount={events.length}
        onRefresh={onRefresh}
      />
      <ViewFilter
        value={view}
        onChange={(v: SportsView) => onChange({ ...config, view: v })}
      />
      <div className="-mr-1 flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <EmptyState view={view} totalCount={events.length} />
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

function EmptyState({ view, totalCount }: { view: SportsView; totalCount: number }) {
  let label: string;
  if (totalCount === 0) {
    label = "Sin partidos esta semana. Añade ligas en Settings";
  } else if (view === "live") {
    label = "Sin partidos en vivo ahora";
  } else if (view === "today") {
    label = "Sin partidos hoy";
  } else if (view === "tomorrow") {
    label = "Sin partidos mañana";
  } else {
    label = "Sin partidos";
  }
  return (
    <div className="flex h-full items-center justify-center text-center text-[11.5px] text-[var(--color-text-lo)]">
      {label}
    </div>
  );
}
