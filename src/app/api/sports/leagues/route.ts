import { NextResponse } from "next/server";
import type { LeagueSummary } from "@/features/widgets/sports/types";
import { ESPN_LEAGUES } from "../_providers/espn";

export const runtime = "nodejs";

/** GET /api/sports/leagues — static catalog of supported leagues for the picker. */
export async function GET() {
  const leagues: LeagueSummary[] = [
    ...Object.entries(ESPN_LEAGUES).map(([id, meta]) => ({
      id,
      sport: meta.sport,
      name: meta.name,
      country: meta.country,
      logo: null,
    })),
    {
      id: "baseball:lidom",
      sport: "baseball" as const,
      name: "LIDOM",
      country: "Dominican Republic",
      logo: null,
    },
  ];

  return NextResponse.json(
    { leagues },
    { headers: { "Cache-Control": "public, s-maxage=86400" } },
  );
}
