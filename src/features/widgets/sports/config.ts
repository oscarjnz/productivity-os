import type { SportKey } from "./types";

export type SportsView = "all" | "live" | "today" | "tomorrow";

export interface SportsConfig {
  /** Sports the user follows (used when no specific leagues are pinned). */
  sports: SportKey[];
  /** League ids from `/api/sports/leagues`. */
  leagues: string[];
  /** Team ids favorited by the user. Used to pin matches involving them. */
  teams: string[];
  /** Default view filter. */
  view: SportsView;
  /** Variant determines layout: ticker (small), list (medium), panel (large). */
  variant: "auto" | "ticker" | "list" | "panel";
  /** Track whether the user has finished the in-widget onboarding. */
  onboarded: boolean;
}

export const defaultSportsConfig: SportsConfig = {
  sports: ["soccer", "basketball", "baseball", "football"],
  leagues: [
    // Soccer — mix of year-round international + popular domestic
    "soccer:fifa.world",
    "soccer:fifa.cwc",
    "soccer:concacaf.gold",
    "soccer:uefa.champions",
    "soccer:eng.1",
    "soccer:esp.1",
    "soccer:usa.1",
    "soccer:mex.1",
    "soccer:bra.1",
    // US majors
    "basketball:nba",
    "baseball:mlb",
    "baseball:lidom",
    "football:nfl",
    "hockey:nhl",
  ],
  teams: [],
  view: "all",
  variant: "auto",
  onboarded: false,
};

export const SPORT_LABELS: Record<SportKey, string> = {
  soccer: "Fútbol",
  basketball: "Basketball",
  football: "NFL",
  baseball: "Béisbol",
  hockey: "Hockey",
};
