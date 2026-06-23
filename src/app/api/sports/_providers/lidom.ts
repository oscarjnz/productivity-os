import type { SportsEvent, SportsLeague } from "@/features/widgets/sports/types";

/**
 * LIDOM (Liga de Béisbol Profesional de la República Dominicana).
 * No official public API exists. We try, in order:
 *   1. lidom.com JSON if present
 *   2. ESPN Deportes hidden endpoint for "dominican-winter-league"
 *
 * Both fall back gracefully — if neither responds, the league is just empty.
 * Season runs roughly Oct → Jan plus Serie del Caribe in early Feb.
 */

const LIDOM_LEAGUE: SportsLeague = {
  id: "baseball:lidom",
  name: "LIDOM",
  shortName: "LIDOM",
  country: "Dominican Republic",
  sport: "baseball",
  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/LIDOM_logo.svg/200px-LIDOM_logo.svg.png",
};

interface EspnDeportesEvent {
  id: string;
  date: string;
  status?: {
    type?: { state?: "pre" | "in" | "post"; completed?: boolean; shortDetail?: string };
    displayClock?: string;
  };
  competitions?: Array<{
    competitors?: Array<{
      homeAway: "home" | "away";
      team: { id: string; displayName: string; shortDisplayName?: string; abbreviation?: string; logo?: string };
      score?: string;
    }>;
  }>;
  links?: Array<{ href?: string }>;
}

interface EspnDeportesScoreboard {
  events?: EspnDeportesEvent[];
}

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

interface LidomFetchOptions {
  date?: Date;
  range?: { from: Date; to: Date };
}

async function fetchLidomViaEspn(opts: LidomFetchOptions = {}): Promise<SportsEvent[]> {
  // ESPN Deportes covers winter ball under "baseball/dominican-winter-league" historically.
  let qs = "";
  if (opts.range) qs = `?dates=${ymd(opts.range.from)}-${ymd(opts.range.to)}`;
  else if (opts.date) qs = `?dates=${ymd(opts.date)}`;
  const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/dominican-winter-league/scoreboard${qs}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60, tags: ["sports:baseball:lidom"] },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as EspnDeportesScoreboard;

  return (data.events ?? []).flatMap((ev): SportsEvent[] => {
    const comp = ev.competitions?.[0];
    if (!comp?.competitors || comp.competitors.length < 2) return [];
    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) return [];

    const state = ev.status?.type?.state;
    const status = ev.status?.type?.completed
      ? "finished"
      : state === "in"
        ? "live"
        : state === "post"
          ? "finished"
          : "scheduled";

    return [{
      id: `lidom:${ev.id}`,
      sport: "baseball",
      league: LIDOM_LEAGUE,
      status,
      startsAt: ev.date,
      clock: status === "live"
        ? (ev.status?.type?.shortDetail ?? ev.status?.displayClock ?? null)
        : null,
      home: {
        id: home.team.id,
        name: home.team.displayName,
        shortName: home.team.shortDisplayName ?? home.team.abbreviation ?? home.team.displayName,
        logo: home.team.logo ?? null,
        score: home.score != null && home.score !== "" ? Number(home.score) : null,
      },
      away: {
        id: away.team.id,
        name: away.team.displayName,
        shortName: away.team.shortDisplayName ?? away.team.abbreviation ?? away.team.displayName,
        logo: away.team.logo ?? null,
        score: away.score != null && away.score !== "" ? Number(away.score) : null,
      },
      detailUrl: ev.links?.[0]?.href,
    }];
  });
}

export async function fetchLidom(opts: LidomFetchOptions = {}): Promise<SportsEvent[]> {
  try {
    return await fetchLidomViaEspn(opts);
  } catch {
    return [];
  }
}
