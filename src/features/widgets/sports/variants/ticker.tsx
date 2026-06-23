"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { SportsEvent } from "../types";
import { TeamLogo } from "../components/team-logo";
import { duration, easing } from "@/config/motion";
import { cn } from "@/lib/utils/cn";

interface TickerProps {
  events: SportsEvent[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function TickerVariant({ events }: TickerProps) {
  const [index, setIndex] = useState(0);
  const pool = events.length === 0 ? [] : events;

  useEffect(() => {
    if (pool.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % pool.length);
    }, 7000);
    return () => window.clearInterval(t);
  }, [pool.length]);

  if (pool.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[11px] text-[var(--color-text-lo)]">
        Sin partidos hoy
      </div>
    );
  }

  const ev = pool[index % pool.length]!;
  const isLive = ev.status === "live";

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          {ev.league.shortName}
        </span>
        {isLive ? (
          <span className="inline-flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-danger)] opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--color-danger)]">
              {ev.clock ?? "LIVE"}
            </span>
          </span>
        ) : ev.status === "finished" ? (
          <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-lo)]">
            FT
          </span>
        ) : (
          <span className="text-[10px] tabular text-[var(--color-text-lo)]">
            {formatTime(ev.startsAt)}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={ev.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: duration.fast, ease: easing.standard }}
          className="flex min-h-0 flex-1 flex-col justify-center gap-1"
        >
          <Side team={ev.home} score={ev.home.score} dim={!isLive && ev.status === "scheduled"} />
          <Side team={ev.away} score={ev.away.score} dim={!isLive && ev.status === "scheduled"} />
        </motion.div>
      </AnimatePresence>

      {pool.length > 1 && (
        <div className="flex items-center justify-center gap-1">
          {pool.slice(0, Math.min(pool.length, 6)).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-0.5 w-2.5 rounded-full transition-colors",
                i === index % Math.min(pool.length, 6)
                  ? "bg-[var(--color-accent)]"
                  : "bg-[var(--color-border)]",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Side({
  team,
  score,
  dim,
}: {
  team: { name: string; shortName: string; logo: string | null };
  score: number | null;
  dim: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-1.5">
        <TeamLogo src={team.logo} alt={team.name} size={14} />
        <span className="truncate text-[11.5px] text-[var(--color-text-mid)]">
          {team.shortName || team.name}
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 tabular text-[13px] font-semibold",
          dim ? "text-[var(--color-text-lo)]" : "text-[var(--color-text-hi)]",
        )}
      >
        {score ?? "—"}
      </span>
    </div>
  );
}
