import type {
  EventStatus,
  SportKey,
  SportsEvent,
  SportsLeague,
} from "@/features/widgets/sports/types";

/**
 * ESPN public (undocumented) JSON endpoints.
 *
 * site.api.espn.com is the same backend ESPN's own apps use. Endpoints are
 * stable for the major US sports + soccer and require no API key. They serve
 * a "scoreboard" feed per league with all events for a given date.
 *
 * No streaming, no copyrighted media — just fixtures, scores, clock and logos.
 */

const BASE = "https://site.api.espn.com/apis/site/v2/sports";

/** League id → ESPN path. Add new leagues here. */
export const ESPN_LEAGUES: Record<
  string,
  { sport: SportKey; path: string; name: string; shortName: string; country: string | null }
> = {
  // ── Soccer ─────────────────────────────────────────────────────────────
  "soccer:eng.1": { sport: "soccer", path: "soccer/eng.1", name: "Premier League", shortName: "EPL", country: "England" },
  "soccer:esp.1": { sport: "soccer", path: "soccer/esp.1", name: "La Liga", shortName: "LaLiga", country: "Spain" },
  "soccer:ger.1": { sport: "soccer", path: "soccer/ger.1", name: "Bundesliga", shortName: "BUN", country: "Germany" },
  "soccer:ita.1": { sport: "soccer", path: "soccer/ita.1", name: "Serie A", shortName: "SERIE A", country: "Italy" },
  "soccer:fra.1": { sport: "soccer", path: "soccer/fra.1", name: "Ligue 1", shortName: "L1", country: "France" },
  "soccer:uefa.champions": { sport: "soccer", path: "soccer/uefa.champions", name: "UEFA Champions League", shortName: "UCL", country: null },
  "soccer:uefa.europa": { sport: "soccer", path: "soccer/uefa.europa", name: "UEFA Europa League", shortName: "UEL", country: null },
  "soccer:conmebol.libertadores": { sport: "soccer", path: "soccer/conmebol.libertadores", name: "Copa Libertadores", shortName: "LIB", country: null },
  "soccer:fifa.world": { sport: "soccer", path: "soccer/fifa.world", name: "FIFA World Cup", shortName: "WC", country: null },
  "soccer:fifa.world.u20": { sport: "soccer", path: "soccer/fifa.world.u20", name: "FIFA U-20 World Cup", shortName: "U20 WC", country: null },
  "soccer:fifa.cwc": { sport: "soccer", path: "soccer/fifa.cwc", name: "FIFA Club World Cup", shortName: "CWC", country: null },
  "soccer:fifa.worldq.conmebol": { sport: "soccer", path: "soccer/fifa.worldq.conmebol", name: "WC Qualifiers - CONMEBOL", shortName: "WCQ-CONMEBOL", country: null },
  "soccer:fifa.worldq.concacaf": { sport: "soccer", path: "soccer/fifa.worldq.concacaf", name: "WC Qualifiers - CONCACAF", shortName: "WCQ-CONCACAF", country: null },
  "soccer:concacaf.gold": { sport: "soccer", path: "soccer/concacaf.gold", name: "CONCACAF Gold Cup", shortName: "GOLD CUP", country: null },
  "soccer:conmebol.america": { sport: "soccer", path: "soccer/conmebol.america", name: "Copa América", shortName: "COPA AM", country: null },
  "soccer:mex.1": { sport: "soccer", path: "soccer/mex.1", name: "Liga MX", shortName: "LIGA MX", country: "Mexico" },
  "soccer:arg.1": { sport: "soccer", path: "soccer/arg.1", name: "Liga Profesional", shortName: "AR1", country: "Argentina" },
  "soccer:bra.1": { sport: "soccer", path: "soccer/bra.1", name: "Brasileirão", shortName: "BRA1", country: "Brazil" },
  "soccer:usa.1": { sport: "soccer", path: "soccer/usa.1", name: "MLS", shortName: "MLS", country: "USA" },
  "soccer:col.1": { sport: "soccer", path: "soccer/col.1", name: "Liga BetPlay", shortName: "COL1", country: "Colombia" },
  "soccer:chi.1": { sport: "soccer", path: "soccer/chi.1", name: "Primera División", shortName: "CHI1", country: "Chile" },
  "soccer:ned.1": { sport: "soccer", path: "soccer/ned.1", name: "Eredivisie", shortName: "ERE", country: "Netherlands" },
  "soccer:por.1": { sport: "soccer", path: "soccer/por.1", name: "Primeira Liga", shortName: "POR1", country: "Portugal" },

  // ── Basketball ─────────────────────────────────────────────────────────
  "basketball:nba": { sport: "basketball", path: "basketball/nba", name: "NBA", shortName: "NBA", country: "USA" },
  "basketball:wnba": { sport: "basketball", path: "basketball/wnba", name: "WNBA", shortName: "WNBA", country: "USA" },
  "basketball:mens-college-basketball": {
    sport: "basketball",
    path: "basketball/mens-college-basketball",
    name: "NCAAM",
    shortName: "NCAAM",
    country: "USA",
  },

  // ── American football ──────────────────────────────────────────────────
  "football:nfl": { sport: "football", path: "football/nfl", name: "NFL", shortName: "NFL", country: "USA" },
  "football:college-football": {
    sport: "football",
    path: "football/college-football",
    name: "NCAA Football",
    shortName: "NCAAF",
    country: "USA",
  },

  // ── Baseball ───────────────────────────────────────────────────────────
  "baseball:mlb": { sport: "baseball", path: "baseball/mlb", name: "MLB", shortName: "MLB", country: "USA" },
  "baseball:college-baseball": {
    sport: "baseball",
    path: "baseball/college-baseball",
    name: "NCAA Baseball",
    shortName: "NCAAB",
    country: "USA",
  },

  // ── Hockey ─────────────────────────────────────────────────────────────
  "hockey:nhl": { sport: "hockey", path: "hockey/nhl", name: "NHL", shortName: "NHL", country: "USA" },
};

interface EspnCompetitor {
  id: string;
  homeAway: "home" | "away";
  team: {
    id: string;
    displayName: string;
    shortDisplayName?: string;
    abbreviation?: string;
    logo?: string;
  };
  score?: string;
}

interface EspnEvent {
  id: string;
  date: string;
  status?: {
    type?: {
      state?: "pre" | "in" | "post";
      completed?: boolean;
      description?: string;
      detail?: string;
      shortDetail?: string;
    };
    displayClock?: string;
    period?: number;
  };
  competitions?: Array<{
    competitors?: EspnCompetitor[];
  }>;
  links?: Array<{ href?: string; rel?: string[] }>;
}

interface EspnScoreboard {
  events?: EspnEvent[];
  leagues?: Array<{ logos?: Array<{ href?: string }> }>;
}

function mapStatus(state: string | undefined, completed: boolean | undefined): EventStatus {
  if (completed) return "finished";
  if (state === "in") return "live";
  if (state === "post") return "finished";
  return "scheduled";
}

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export interface EspnFetchOptions {
  /** Single day. Mutually exclusive with `range`. */
  date?: Date;
  /** Date range: from..to inclusive. ESPN supports YYYYMMDD-YYYYMMDD. */
  range?: { from: Date; to: Date };
}

export async function fetchEspnLeague(
  leagueKey: string,
  opts: EspnFetchOptions = {},
): Promise<SportsEvent[]> {
  const meta = ESPN_LEAGUES[leagueKey];
  if (!meta) return [];

  let qs = "";
  if (opts.range) qs = `?dates=${ymd(opts.range.from)}-${ymd(opts.range.to)}`;
  else if (opts.date) qs = `?dates=${ymd(opts.date)}`;

  const url = `${BASE}/${meta.path}/scoreboard${qs}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60, tags: [`sports:${leagueKey}`] },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as EspnScoreboard;

  const leagueLogo = data.leagues?.[0]?.logos?.[0]?.href ?? null;
  const league: SportsLeague = {
    id: leagueKey,
    name: meta.name,
    shortName: meta.shortName,
    country: meta.country,
    sport: meta.sport,
    logo: leagueLogo,
  };

  return (data.events ?? []).flatMap((ev): SportsEvent[] => {
    const comp = ev.competitions?.[0];
    if (!comp?.competitors || comp.competitors.length < 2) return [];

    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) return [];

    const status = mapStatus(ev.status?.type?.state, ev.status?.type?.completed);
    const clock = status === "live"
      ? (ev.status?.type?.shortDetail ?? ev.status?.displayClock ?? null)
      : null;

    const detailLink = ev.links?.find((l) => l.rel?.includes("desktop"))?.href
      ?? ev.links?.[0]?.href;

    return [{
      id: `espn:${ev.id}`,
      sport: meta.sport,
      league,
      status,
      startsAt: ev.date,
      clock,
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
      detailUrl: detailLink,
    }];
  });
}
