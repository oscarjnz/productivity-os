/**
 * API-Football (api-sports.io) enrichment — soccer only.
 *
 * ESPN gives us scores + scoring plays for free. This adds the "depth" layer
 * the user asked for: starting XI, a full minute-by-minute event timeline, and
 * match statistics. It is strictly additive — if the key is missing or the
 * fixture can't be matched, callers fall back to the ESPN-only detail.
 *
 * Quota: the free tier is ~100 requests/day. We spend at most 4 per fresh
 * match (1 to find the fixture by date + 3 for lineups/events/stats) and lean
 * on Next's fetch cache so reopening a match is free.
 */

import type {
  MatchLineups,
  MatchStat,
  TeamLineup,
  TimelineEvent,
  Side,
} from "@/features/widgets/sports/types";

const HOST = "https://v3.football.api-sports.io";

export function hasApiFootball(): boolean {
  return !!process.env.API_FOOTBALL_KEY;
}

async function af<T>(path: string, revalidate: number): Promise<T | null> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${HOST}${path}`, {
      headers: { "x-apisports-key": key, Accept: "application/json" },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ----------------------------- name matching ----------------------------- */

const STRIP_WORDS = new Set([
  "fc", "cf", "sc", "afc", "ac", "cd", "ca", "fk", "sk", "if", "bk", "sv",
  "club", "deportivo", "atletico", "athletic", "real", "the", "de", "of",
]);

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(name: string): string[] {
  return normalize(name)
    .split(" ")
    .filter((t) => t.length >= 3 && !STRIP_WORDS.has(t));
}

/** Loose cross-provider team match (ESPN "Manchester City" vs AF "Man City"). */
function sameTeam(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && nb.includes(na)) return true;
  if (nb.length >= 4 && na.includes(nb)) return true;
  const ta = new Set(tokens(a));
  const tb = tokens(b);
  return tb.some((t) => ta.has(t));
}

/* ------------------------------ AF payloads ------------------------------ */

interface AfFixtureRow {
  fixture: { id: number; date: string };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
}
interface AfLineupRow {
  team: { id: number };
  formation: string | null;
  coach?: { name?: string | null };
  startXI?: Array<{ player?: { name?: string; number?: number; pos?: string } }>;
  substitutes?: Array<{ player?: { name?: string; number?: number; pos?: string } }>;
}
interface AfEventRow {
  time: { elapsed: number | null; extra: number | null };
  team: { id: number };
  player?: { name?: string | null };
  assist?: { name?: string | null };
  type?: string;
  detail?: string;
}
interface AfStatRow {
  team: { id: number };
  statistics?: Array<{ type?: string; value?: string | number | null }>;
}

interface Enriched {
  lineups: MatchLineups | null;
  timeline: TimelineEvent[] | null;
  stats: MatchStat[] | null;
  enriched: boolean;
}

/** Find the API-Football fixture id for an ESPN match by UTC date + teams. */
async function findFixture(
  homeName: string,
  awayName: string,
  isoDate: string,
): Promise<{ id: number; homeId: number; awayId: number } | null> {
  const date = isoDate.slice(0, 10);
  const data = await af<{ response: AfFixtureRow[] }>(
    `/fixtures?date=${date}&timezone=UTC`,
    21_600, // 6h — the day's fixture list is effectively static
  );
  const rows = data?.response ?? [];
  if (rows.length === 0) return null;

  const target = new Date(isoDate).getTime();
  let best: { id: number; homeId: number; awayId: number; score: number } | null = null;

  for (const r of rows) {
    const homeMatch = sameTeam(homeName, r.teams.home.name);
    const awayMatch = sameTeam(awayName, r.teams.away.name);
    if (!homeMatch || !awayMatch) continue;
    // Tie-break by kickoff proximity so same-day rematches don't collide.
    const dt = Math.abs(new Date(r.fixture.date).getTime() - target);
    const score = -dt;
    if (!best || score > best.score) {
      best = { id: r.fixture.id, homeId: r.teams.home.id, awayId: r.teams.away.id, score };
    }
  }
  return best ? { id: best.id, homeId: best.homeId, awayId: best.awayId } : null;
}

function mapLineups(
  rows: AfLineupRow[],
  homeId: number,
  awayId: number,
): MatchLineups | null {
  const build = (row: AfLineupRow | undefined, side: Side): TeamLineup | null => {
    if (!row) return null;
    const players = (arr: AfLineupRow["startXI"]) =>
      (arr ?? [])
        .map((p) => ({
          name: p.player?.name ?? "",
          number: typeof p.player?.number === "number" ? p.player.number : null,
          pos: p.player?.pos ?? null,
        }))
        .filter((p) => p.name.length > 0);
    return {
      side,
      formation: row.formation ?? null,
      coach: row.coach?.name ?? null,
      startXI: players(row.startXI),
      subs: players(row.substitutes),
    };
  };
  const home = build(rows.find((r) => r.team.id === homeId), "home");
  const away = build(rows.find((r) => r.team.id === awayId), "away");
  if (!home && !away) return null;
  if (!home || !away) return null;
  if (home.startXI.length === 0 && away.startXI.length === 0) return null;
  return { home, away };
}

function mapTimeline(rows: AfEventRow[], homeId: number): TimelineEvent[] {
  const kind = (t?: string): TimelineEvent["type"] => {
    const s = (t ?? "").toLowerCase();
    if (s === "goal") return "goal";
    if (s === "card") return "card";
    if (s === "subst") return "subst";
    if (s === "var") return "var";
    return "other";
  };
  return rows
    .map((e): TimelineEvent => {
      const extra = e.time.extra ? `+${e.time.extra}` : "";
      const minute = e.time.elapsed != null ? `${e.time.elapsed}${extra}'` : "";
      return {
        minute,
        type: kind(e.type),
        detail: e.detail ?? "",
        side: e.team.id === homeId ? "home" : "away",
        player: e.player?.name ?? null,
        assist: e.assist?.name ?? null,
      };
    })
    .filter((e) => e.minute.length > 0);
}

function mapStats(rows: AfStatRow[], homeId: number, awayId: number): MatchStat[] {
  const home = rows.find((r) => r.team.id === homeId)?.statistics ?? [];
  const away = rows.find((r) => r.team.id === awayId)?.statistics ?? [];
  const labels = new Set<string>();
  for (const s of home) if (s.type) labels.add(s.type);
  for (const s of away) if (s.type) labels.add(s.type);
  const pick = (arr: typeof home, label: string) =>
    arr.find((s) => s.type === label)?.value ?? null;
  return Array.from(labels).map((label) => ({
    label,
    home: pick(home, label),
    away: pick(away, label),
  }));
}

export async function enrichSoccerMatch(opts: {
  homeName: string;
  awayName: string;
  isoDate: string;
  live: boolean;
}): Promise<Enriched | null> {
  if (!hasApiFootball()) return null;
  const fixture = await findFixture(opts.homeName, opts.awayName, opts.isoDate);
  if (!fixture) return null;

  // Lineups change rarely once announced; events/stats move during live play.
  const detailTtl = opts.live ? 60 : 21_600;
  const [lineupsRes, eventsRes, statsRes] = await Promise.all([
    af<{ response: AfLineupRow[] }>(`/fixtures/lineups?fixture=${fixture.id}`, opts.live ? 300 : 21_600),
    af<{ response: AfEventRow[] }>(`/fixtures/events?fixture=${fixture.id}`, detailTtl),
    af<{ response: AfStatRow[] }>(`/fixtures/statistics?fixture=${fixture.id}`, detailTtl),
  ]);

  const lineups = lineupsRes ? mapLineups(lineupsRes.response, fixture.homeId, fixture.awayId) : null;
  const timeline = eventsRes ? mapTimeline(eventsRes.response, fixture.homeId) : null;
  const stats = statsRes ? mapStats(statsRes.response, fixture.homeId, fixture.awayId) : null;

  const enriched = !!(lineups || (timeline && timeline.length) || (stats && stats.length));
  if (!enriched) return null;
  return { lineups, timeline: timeline?.length ? timeline : null, stats: stats?.length ? stats : null, enriched };
}
