/**
 * Normalized sports event shape used across all sports/providers.
 * Each provider adapter maps its raw payload into this contract.
 */

export type SportKey =
  | "soccer"
  | "basketball"
  | "football"
  | "baseball"
  | "hockey";

export type EventStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled";

export interface SportsTeam {
  id: string;
  name: string;
  shortName: string;
  logo: string | null;
  score: number | null;
}

export interface SportsLeague {
  id: string;
  name: string;
  shortName: string;
  country: string | null;
  sport: SportKey;
  logo: string | null;
}

export interface SportsEvent {
  id: string;
  sport: SportKey;
  league: SportsLeague;
  status: EventStatus;
  /** ISO-8601 start time. */
  startsAt: string;
  /** Display string for current period/minute (e.g. "67'", "Q3 2:34", "Top 5"). Null when scheduled/finished. */
  clock: string | null;
  home: SportsTeam;
  away: SportsTeam;
  /** Provider-specific external URL for the match. */
  detailUrl?: string;
}

export interface SportsFeed {
  events: SportsEvent[];
  fetchedAt: number;
  /** Indicates which providers responded (for debugging UI). */
  sources: string[];
}

export interface LeagueSummary {
  id: string;
  sport: SportKey;
  name: string;
  country: string | null;
  logo: string | null;
}

export interface TeamSummary {
  id: string;
  sport: SportKey;
  name: string;
  shortName: string;
  logo: string | null;
  leagueId: string | null;
}

/* ---------------------------------------------------------------------------
 * Match detail (scoring plays, box score)
 * ------------------------------------------------------------------------- */

/** A single scoring event within a match — goal, run, touchdown, etc. */
export interface ScoringPlay {
  id: string;
  /** Who scored (best-effort, language depends on provider). */
  scorer: string | null;
  /** Assist or RBI when applicable. */
  assist: string | null;
  /** Time / inning / quarter display (e.g. "67'", "Top 3", "Q2 04:21"). */
  clock: string | null;
  /** Plain-language description of the play. */
  text: string;
  /** Team id that scored. */
  teamId: string;
  /** Type tag: "goal", "penalty", "own-goal", "home-run", "run", "touchdown", "field-goal", "rush"… */
  kind: string;
  /** Score after the play (home–away). */
  homeScore: number | null;
  awayScore: number | null;
}

/* ---------------------------------------------------------------------------
 * Rich detail (soccer, via API-Football) — all optional; absent when the key
 * isn't set or the fixture couldn't be matched.
 * ------------------------------------------------------------------------- */

export type Side = "home" | "away";

export interface LineupPlayer {
  name: string;
  number: number | null;
  /** Position code: G / D / M / F (best-effort). */
  pos: string | null;
}

export interface TeamLineup {
  side: Side;
  formation: string | null;
  coach: string | null;
  startXI: LineupPlayer[];
  subs: LineupPlayer[];
}

export interface TimelineEvent {
  /** Minute display, e.g. "23'", "45+2'". */
  minute: string;
  type: "goal" | "card" | "subst" | "var" | "other";
  /** Provider detail, e.g. "Normal Goal", "Yellow Card". */
  detail: string;
  side: Side;
  player: string | null;
  /** Assist (goal) or player coming on (subst). */
  assist: string | null;
}

export interface MatchStat {
  label: string;
  home: string | number | null;
  away: string | number | null;
}

export interface MatchLineups {
  home: TeamLineup;
  away: TeamLineup;
}

export interface MatchDetail {
  eventId: string;
  status: EventStatus;
  clock: string | null;
  scoringPlays: ScoringPlay[];
  /** Lineups/box-score TBD per sport; minimal for now. */
  venue: string | null;
  /** Rich soccer detail from API-Football, when available. */
  lineups?: MatchLineups | null;
  timeline?: TimelineEvent[] | null;
  stats?: MatchStat[] | null;
  /** True when API-Football enrichment succeeded (drawer prefers it). */
  enriched?: boolean;
}
