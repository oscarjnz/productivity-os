"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  LeagueSummary,
  MatchDetail,
  SportsEvent,
  SportsFeed,
  SportKey,
} from "./types";

interface UseSportsOptions {
  leagues: string[];
  sports: SportKey[];
  date?: Date;
}

export function useSportsFeed({ leagues, sports, date }: UseSportsOptions) {
  return useQuery<SportsFeed>({
    queryKey: ["sports", "feed", leagues.join(","), sports.join(","), date?.toISOString() ?? ""],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (leagues.length > 0) params.set("leagues", leagues.join(","));
      else if (sports.length > 0) params.set("sports", sports.join(","));
      if (date) params.set("date", date.toISOString().slice(0, 10));

      const res = await fetch(`/api/sports?${params.toString()}`, { signal });
      if (!res.ok) throw new Error(`Sports feed ${res.status}`);
      return (await res.json()) as SportsFeed;
    },
    /** Live games shift fast — keep stale time short but lean on HTTP cache. */
    staleTime: 30_000,
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return 60_000;
      const hasLive = data.events.some((e) => e.status === "live");
      return hasLive ? 30_000 : 120_000;
    },
    gcTime: 5 * 60_000,
  });
}

export function useLeagueCatalog() {
  return useQuery<{ leagues: LeagueSummary[] }>({
    queryKey: ["sports", "leagues"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/sports/leagues", { signal });
      if (!res.ok) throw new Error(`Leagues ${res.status}`);
      return (await res.json()) as { leagues: LeagueSummary[] };
    },
    staleTime: 24 * 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
  });
}

/** Splits a feed into the three groups the UI cares about. */
export function bucketEvents(events: SportsEvent[]) {
  const live: SportsEvent[] = [];
  const upcoming: SportsEvent[] = [];
  const finished: SportsEvent[] = [];

  for (const e of events) {
    if (e.status === "live") live.push(e);
    else if (e.status === "finished") finished.push(e);
    else upcoming.push(e);
  }

  return { live, upcoming, finished };
}

export function useEventDetail(
  eventId: string | null,
  leagueId: string | null,
  status: SportsEvent["status"] | null,
) {
  return useQuery<MatchDetail>({
    queryKey: ["sports", "event", eventId, leagueId],
    enabled: !!eventId && !!leagueId,
    queryFn: async ({ signal }) => {
      if (!eventId || !leagueId) throw new Error("Missing event/league id");
      const res = await fetch(
        `/api/sports/event/${encodeURIComponent(eventId)}?league=${encodeURIComponent(leagueId)}`,
        { signal },
      );
      if (!res.ok) throw new Error(`Event detail ${res.status}`);
      return (await res.json()) as MatchDetail;
    },
    /** Refresh live matches every 30s; finished/scheduled stay cached. */
    staleTime: status === "live" ? 30_000 : 5 * 60_000,
    refetchInterval: status === "live" ? 30_000 : false,
    gcTime: 10 * 60_000,
  });
}

/** Pin events whose teams are favorited to the top of their bucket. */
export function pinFavorites(events: SportsEvent[], teamIds: string[]): SportsEvent[] {
  if (teamIds.length === 0) return events;
  const set = new Set(teamIds);
  const isFav = (e: SportsEvent) => set.has(e.home.id) || set.has(e.away.id);
  return [...events].sort((a, b) => {
    const af = isFav(a) ? 0 : 1;
    const bf = isFav(b) ? 0 : 1;
    return af - bf;
  });
}
