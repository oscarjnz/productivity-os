import { NextResponse, type NextRequest } from "next/server";
import type { MatchDetail, ScoringPlay } from "@/features/widgets/sports/types";
import { ESPN_LEAGUES } from "../../_providers/espn";
import { enrichSoccerMatch, hasApiFootball } from "../../_providers/apifootball";

export const runtime = "nodejs";

/**
 * GET /api/sports/event/{providerId}?league=soccer:eng.1
 *
 * `providerId` is the event id with the provider prefix kept (e.g. "espn:704321"
 * or "lidom:123"). We need the league key as a hint to know which ESPN sport
 * path to call — pass it via `?league=`.
 */

interface EspnAthlete {
  athlete?: { displayName?: string };
  type?: string;
}

interface EspnScoringPlay {
  id?: string;
  type?: { id?: string; text?: string };
  text?: string;
  clock?: { displayValue?: string };
  period?: { number?: number; displayValue?: string };
  team?: { id?: string };
  homeScore?: number;
  awayScore?: number;
  scoringType?: { name?: string; displayName?: string };
  participants?: EspnAthlete[];
  /** Soccer-specific shorthand. */
  athletesInvolved?: Array<{ displayName?: string; type?: string }>;
}

interface EspnSummary {
  scoringPlays?: EspnScoringPlay[];
  gameInfo?: { venue?: { fullName?: string } };
  header?: {
    competitions?: Array<{
      status?: {
        type?: { state?: string; completed?: boolean };
        displayClock?: string;
      };
    }>;
  };
}

function leagueToPath(leagueKey: string | null): string | null {
  if (!leagueKey) return null;
  if (leagueKey === "baseball:lidom") return "baseball/dominican-winter-league";
  const meta = ESPN_LEAGUES[leagueKey];
  return meta?.path ?? null;
}

function stripPrefix(id: string): string {
  const i = id.indexOf(":");
  return i < 0 ? id : id.slice(i + 1);
}

function deriveClock(p: EspnScoringPlay): string | null {
  const minute = p.clock?.displayValue?.trim();
  const period = p.period?.displayValue ?? (p.period?.number ? `P${p.period.number}` : "");
  if (minute && period) return `${period} ${minute}`;
  return minute || period || null;
}

function deriveScorer(p: EspnScoringPlay): { scorer: string | null; assist: string | null } {
  const involved = p.athletesInvolved ?? [];
  const participants = p.participants ?? [];
  type Athlete = { name: string; type: string | undefined };
  const all: Athlete[] = [
    ...involved.map((a) => ({ name: a.displayName, type: a.type })),
    ...participants.map((a) => ({ name: a.athlete?.displayName, type: a.type })),
  ].filter((a): a is Athlete => typeof a.name === "string" && a.name.length > 0);
  if (all.length === 0) return { scorer: null, assist: null };
  const scorer = all.find((a) => a.type === "scorer" || a.type === "rusher" || a.type === "passer")
    ?? all[0]!;
  const assist = all.find((a) =>
    a.type === "assist" || a.type === "receiver" || a.type === "rbi",
  );
  return { scorer: scorer.name, assist: assist?.name ?? null };
}

function deriveKind(p: EspnScoringPlay): string {
  const t = p.type?.text?.toLowerCase() ?? p.scoringType?.name?.toLowerCase() ?? "";
  if (t.includes("penalty")) return "penalty";
  if (t.includes("own")) return "own-goal";
  if (t.includes("goal")) return "goal";
  if (t.includes("home run")) return "home-run";
  if (t.includes("touchdown")) return "touchdown";
  if (t.includes("field goal")) return "field-goal";
  if (t.includes("safety")) return "safety";
  if (t.includes("run") || t.includes("rbi")) return "run";
  if (t.includes("three") || t.includes("3pt")) return "three-pointer";
  if (t.includes("two") || t.includes("2pt")) return "two-pointer";
  if (t.includes("free throw")) return "free-throw";
  return "score";
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const leagueKey = url.searchParams.get("league");

  const path = leagueToPath(leagueKey);
  if (!path) return NextResponse.json({ error: "Unknown league" }, { status: 400 });

  const eventId = stripPrefix(id);
  const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${path}/summary?event=${eventId}`;

  const res = await fetch(summaryUrl, {
    headers: { Accept: "application/json" },
    next: { revalidate: 30, tags: [`sports:event:${eventId}`] },
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Upstream ${res.status}` },
      { status: 502 },
    );
  }
  const data = (await res.json()) as EspnSummary;

  const plays: ScoringPlay[] = (data.scoringPlays ?? []).map((p, i): ScoringPlay => {
    const { scorer, assist } = deriveScorer(p);
    return {
      id: p.id ?? `${eventId}-${i}`,
      scorer,
      assist,
      clock: deriveClock(p),
      text: p.text ?? "",
      teamId: p.team?.id ?? "",
      kind: deriveKind(p),
      homeScore: typeof p.homeScore === "number" ? p.homeScore : null,
      awayScore: typeof p.awayScore === "number" ? p.awayScore : null,
    };
  });

  const compStatus = data.header?.competitions?.[0]?.status;
  const status = compStatus?.type?.completed
    ? "finished"
    : compStatus?.type?.state === "in"
      ? "live"
      : compStatus?.type?.state === "post"
        ? "finished"
        : "scheduled";

  const detail: MatchDetail = {
    eventId: id,
    status,
    clock: compStatus?.displayClock ?? null,
    scoringPlays: plays,
    venue: data.gameInfo?.venue?.fullName ?? null,
  };

  // Soccer enrichment via API-Football (lineups / timeline / stats). Strictly
  // additive and wrapped so a failure never degrades the ESPN-based response.
  const sport = url.searchParams.get("sport");
  const home = url.searchParams.get("home");
  const away = url.searchParams.get("away");
  const date = url.searchParams.get("date");
  if (sport === "soccer" && home && away && date && hasApiFootball()) {
    try {
      const extra = await enrichSoccerMatch({
        homeName: home,
        awayName: away,
        isoDate: date,
        live: status === "live",
      });
      if (extra) {
        detail.lineups = extra.lineups;
        detail.timeline = extra.timeline;
        detail.stats = extra.stats;
        detail.enriched = true;
      }
    } catch {
      // keep ESPN-only detail
    }
  }

  return NextResponse.json(detail, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
}
