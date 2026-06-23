"use client";

import { useEventDetail } from "../use-sports";
import type { ScoringPlay, SportsEvent } from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

interface ScoringPlaysProps {
  event: SportsEvent;
}

/** Compact monochrome tag for the play type — replaces emoji with a crisp,
 *  platform-consistent label that reads as premium sports-data UI. */
function kindTag(kind: string): string {
  switch (kind) {
    case "goal":
      return "GOL";
    case "penalty":
      return "PEN";
    case "own-goal":
      return "AG";
    case "home-run":
      return "HR";
    case "run":
      return "R";
    case "touchdown":
      return "TD";
    case "field-goal":
      return "FG";
    case "three-pointer":
      return "3PT";
    case "two-pointer":
      return "2PT";
    case "free-throw":
      return "FT";
    default:
      return "•";
  }
}

export function ScoringPlays({ event }: ScoringPlaysProps) {
  const { data, isLoading, isError } = useEventDetail(
    event.id,
    event.league.id,
    event.status,
  );

  if (isError) {
    return (
      <div className="px-3 py-2 text-[11px] text-[var(--color-text-lo)]">
        No pude cargar las jugadas.
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-2 px-3 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (data.scoringPlays.length === 0) {
    return (
      <div className="px-3 py-3 text-center text-[11px] text-[var(--color-text-lo)]">
        {event.status === "scheduled"
          ? "Aún no empieza"
          : "Sin jugadas registradas todavía"}
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-0.5 px-1 py-1">
      {data.scoringPlays.map((p) => (
        <PlayRow key={p.id} play={p} event={event} />
      ))}
    </ol>
  );
}

function PlayRow({ play, event }: { play: ScoringPlay; event: SportsEvent }) {
  const isHome = play.teamId === event.home.id;
  const teamColor = isHome
    ? "var(--color-accent)"
    : "var(--color-text-mid)";

  return (
    <li
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5",
        "hover:bg-[var(--color-bg-raised)]",
      )}
    >
      <span
        className={cn(
          "mt-px inline-flex h-4 min-w-[1.75rem] shrink-0 items-center justify-center rounded-[var(--radius-xs)] px-1",
          "text-[9px] font-semibold uppercase tracking-[0.04em] tabular",
          isHome
            ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
            : "bg-[var(--color-surface-glass)] text-[var(--color-text-mid)]",
        )}
        title={play.kind}
      >
        {kindTag(play.kind)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[11.5px] font-medium text-[var(--color-text-hi)]">
            {play.scorer ?? play.text.split(/[,.]/)[0]}
          </span>
          {play.clock && (
            <span
              className="shrink-0 tabular text-[10px] text-[var(--color-text-lo)]"
              style={{ color: teamColor }}
            >
              {play.clock}
            </span>
          )}
        </div>
        {play.assist && (
          <span className="text-[10.5px] text-[var(--color-text-lo)]">
            Asist./RBI · {play.assist}
          </span>
        )}
        {play.homeScore !== null && play.awayScore !== null && (
          <span className="text-[10.5px] tabular text-[var(--color-text-lo)]">
            {play.homeScore} – {play.awayScore}
          </span>
        )}
      </div>
    </li>
  );
}
