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
