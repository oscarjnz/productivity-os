import { NextResponse, type NextRequest } from "next/server";
import type { SportsEvent, SportsFeed, SportKey } from "@/features/widgets/sports/types";
import { ESPN_LEAGUES, fetchEspnLeague } from "./_providers/espn";
import { fetchLidom } from "./_providers/lidom";

export const runtime = "nodejs";

/**
 * GET /api/sports
 *
 * Query params:
 *   leagues=soccer:eng.1,basketball:nba   pinned league list
 *   sports=soccer,basketball              fallback when no `leagues` provided
 *   date=YYYY-MM-DD                       single day; otherwise we fetch today..today+7
 *   window=N                              number of forward days (default 7, max 30)
 *
 * Default behavior: fetch a 7-day window forward from "today" so offseason
 * leagues still surface their next match instead of showing empty.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const leaguesParam = url.searchParams.get("leagues");
  const sportsParam = url.searchParams.get("sports");
  const dateParam = url.searchParams.get("date");
  const windowParam = url.searchParams.get("window");

  let opts: { date?: Date; range?: { from: Date; to: Date } };
  if (dateParam) {
    opts = { date: new Date(dateParam) };
  } else {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const days = Math.min(Math.max(Number(windowParam) || 7, 1), 30);
    const to = new Date(from);
    to.setDate(to.getDate() + days);
    opts = { range: { from, to } };
  }

  const leagueKeys = resolveLeagueKeys(leaguesParam, sportsParam);

  const lidomRequested = leagueKeys.includes("baseball:lidom");
  const espnKeys = leagueKeys.filter((k) => k !== "baseball:lidom");

  const results = await Promise.allSettled([
    ...espnKeys.map((k) => fetchEspnLeague(k, opts)),
    ...(lidomRequested ? [fetchLidom(opts)] : []),
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

/**
 * Curated defaults. Includes year-round international competitions so users
 * who only select "soccer" still see World Cup / Gold Cup / CWC matches even
 * when domestic leagues are in offseason.
 */
const DEFAULT_LEAGUES = new Set([
  "soccer:eng.1",
  "soccer:esp.1",
  "soccer:uefa.champions",
  "soccer:fifa.world",
  "soccer:fifa.cwc",
  "soccer:concacaf.gold",
  "soccer:usa.1",
  "soccer:mex.1",
  "soccer:arg.1",
  "soccer:bra.1",
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
