import { NextResponse, type NextRequest } from "next/server";
import type { SportsEvent, SportsFeed, SportKey } from "@/features/widgets/sports/types";
import { ESPN_LEAGUES, fetchEspnLeague } from "./_providers/espn";
import { fetchLidom } from "./_providers/lidom";

export const runtime = "nodejs";

/**
 * GET /api/sports?leagues=soccer:eng.1,basketball:nba&date=2026-06-23
 *
 * If `leagues` is omitted we return a default mix (top leagues across the
 * sports the user selected). Responses are cached upstream by each provider
 * via Next's fetch revalidate (60s).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const leaguesParam = url.searchParams.get("leagues");
  const sportsParam = url.searchParams.get("sports");
  const dateParam = url.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : undefined;

  const leagueKeys = resolveLeagueKeys(leaguesParam, sportsParam);

  const lidomRequested = leagueKeys.includes("baseball:lidom");
  const espnKeys = leagueKeys.filter((k) => k !== "baseball:lidom");

  const results = await Promise.allSettled([
    ...espnKeys.map((k) => fetchEspnLeague(k, date)),
    ...(lidomRequested ? [fetchLidom(date)] : []),
  ]);

  const events: SportsEvent[] = [];
  const sources: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.length > 0) {
      const key = i < espnKeys.length ? espnKeys[i]! : "baseball:lidom";
      sources.push(key);
      events.push(...r.value);
    }
  });

  events.sort(sortEvents);

  const feed: SportsFeed = {
    events,
    fetchedAt: Date.now(),
    sources,
  };

  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
    },
  });
}

function resolveLeagueKeys(
  leaguesParam: string | null,
  sportsParam: string | null,
): string[] {
  if (leaguesParam) {
    return leaguesParam
      .split(",")
      .map((s) => s.trim())
      .filter((k) => k === "baseball:lidom" || k in ESPN_LEAGUES);
  }

  const sports = (sportsParam?.split(",").map((s) => s.trim()) ?? [
    "soccer",
    "basketball",
    "football",
    "baseball",
    "hockey",
  ]) as SportKey[];

  return Object.entries(ESPN_LEAGUES)
    .filter(([, meta]) => sports.includes(meta.sport))
    .filter(([k]) => isDefaultLeague(k))
    .map(([k]) => k)
    .concat(sports.includes("baseball") ? ["baseball:lidom"] : []);
}

const DEFAULT_LEAGUES = new Set([
  "soccer:eng.1",
  "soccer:esp.1",
  "soccer:uefa.champions",
  "soccer:fifa.world",
  "soccer:usa.1",
  "soccer:mex.1",
  "basketball:nba",
  "football:nfl",
  "baseball:mlb",
  "hockey:nhl",
]);

function isDefaultLeague(k: string): boolean {
  return DEFAULT_LEAGUES.has(k);
}

function statusRank(s: SportsEvent["status"]): number {
  switch (s) {
    case "live":
      return 0;
    case "scheduled":
      return 1;
    case "postponed":
      return 2;
    case "finished":
      return 3;
    case "cancelled":
      return 4;
  }
}

function sortEvents(a: SportsEvent, b: SportsEvent): number {
  const ra = statusRank(a.status);
  const rb = statusRank(b.status);
  if (ra !== rb) return ra - rb;
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}
