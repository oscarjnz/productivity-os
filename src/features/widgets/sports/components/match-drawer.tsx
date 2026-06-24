"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, X } from "lucide-react";
import { motion } from "motion/react";
import type { SportsEvent } from "../types";
import { TeamLogo } from "./team-logo";
import { ScoringPlays } from "./scoring-plays";
import { Lineups } from "./lineups";
import { Timeline } from "./timeline";
import { MatchStats } from "./match-stats";
import { useEventDetail } from "../use-sports";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";

interface MatchDrawerProps {
  event: SportsEvent | null;
  onClose: () => void;
}

export function MatchDrawer({ event, onClose }: MatchDrawerProps) {
  useEffect(() => {
    if (!event) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [event]);

  return (
    <Dialog.Root open={event !== null} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[var(--z-modal)] bg-black/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed right-2 top-2 bottom-2 z-[var(--z-modal)] flex w-[min(420px,calc(100vw-1rem))] flex-col",
            "rounded-[var(--radius-md)] glass-hi shadow-[var(--shadow-lg)] outline-none overflow-hidden",
          )}
        >
          {event && <DrawerBody event={event} onClose={onClose} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type DetailTab = "events" | "lineups" | "stats";

function DrawerBody({ event, onClose }: { event: SportsEvent; onClose: () => void }) {
  const isLive = event.status === "live";
  const { data: detail } = useEventDetail(event);
  const [tab, setTab] = useState<DetailTab>("events");

  const hasTimeline = !!(detail?.enriched && detail.timeline && detail.timeline.length);
  const hasLineups = !!detail?.lineups;
  const hasStats = !!(detail?.stats && detail.stats.length);

  const tabs: { key: DetailTab; label: string }[] = [
    { key: "events", label: hasTimeline ? "Eventos" : "Jugadas" },
  ];
  if (hasLineups) tabs.push({ key: "lineups", label: "Alineación" });
  if (hasStats) tabs.push({ key: "stats", label: "Stats" });
  const activeTab = tabs.some((t) => t.key === tab) ? tab : "events";

  return (
    <motion.div
      initial={{ x: 16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: duration.fast, ease: easing.standard }}
      className="flex h-full flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--color-border)] p-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Dialog.Title className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
            {event.league.name}
            {event.league.country && (
              <span className="text-[var(--color-text-lo)]/70"> · {event.league.country}</span>
            )}
          </Dialog.Title>
          <span className="text-[11px] text-[var(--color-text-mid)]">
            {formatDate(event.startsAt)}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-xs)]",
            "text-[var(--color-text-lo)] hover:bg-[var(--color-bg-raised)] hover:text-[var(--color-text-hi)]",
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      {/* Scoreboard */}
      <div className="flex shrink-0 items-center gap-3 p-4">
        <Side
          name={event.home.name}
          logo={event.home.logo}
          score={event.home.score}
          dim={event.status === "scheduled"}
        />
        <div className="flex flex-col items-center gap-1">
          {isLive ? (
            <span className="inline-flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-danger)] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-danger)]" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-danger)]">
                {event.clock ?? "LIVE"}
              </span>
            </span>
          ) : event.status === "finished" ? (
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-lo)]">
              FINAL
            </span>
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-lo)]">
              PRÓXIMO
            </span>
          )}
          <span className="text-[10px] text-[var(--color-text-lo)]">vs</span>
        </div>
        <Side
          name={event.away.name}
          logo={event.away.logo}
          score={event.away.score}
          dim={event.status === "scheduled"}
        />
      </div>

      {/* Tabs (only when API-Football enrichment added more than scoring plays) */}
      {tabs.length > 1 && (
        <div className="flex shrink-0 items-center gap-1 border-b border-[var(--color-border)] px-3 pb-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10.5px] font-medium",
                "border transition-colors duration-[var(--duration-fast)]",
                activeTab === t.key
                  ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Detail body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === "events" &&
          (hasTimeline ? (
            <Timeline events={detail!.timeline!} />
          ) : (
            <>
              <div className="px-3 pt-2 pb-1">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
                  Jugadas
                </h4>
              </div>
              <ScoringPlays event={event} />
            </>
          ))}
        {activeTab === "lineups" && hasLineups && (
          <Lineups
            lineups={detail!.lineups!}
            homeName={event.home.name}
            awayName={event.away.name}
          />
        )}
        {activeTab === "stats" && hasStats && <MatchStats stats={detail!.stats!} />}
      </div>

      {/* Footer / external link */}
      <div className="shrink-0 border-t border-[var(--color-border)] p-3">
        {event.detailUrl ? (
          <a
            href={event.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 text-[11.5px] text-[var(--color-accent)] hover:underline",
            )}
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            Ver detalles en ESPN
          </a>
        ) : (
          <span className="text-[11px] text-[var(--color-text-lo)]">
            Datos en tiempo real · sin streaming
          </span>
        )}
      </div>
    </motion.div>
  );
}

function Side({
  name,
  logo,
  score,
  dim,
}: {
  name: string;
  logo: string | null;
  score: number | null;
  dim: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      <TeamLogo src={logo} alt={name} size={44} />
      <span className="line-clamp-2 text-center text-[11.5px] text-[var(--color-text-mid)]">
        {name}
      </span>
      <span
        className={cn(
          "tabular text-[28px] font-semibold leading-none",
          dim ? "text-[var(--color-text-lo)]" : "text-[var(--color-text-hi)]",
        )}
      >
        {score ?? "—"}
      </span>
    </div>
  );
}
