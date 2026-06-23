import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/currency?base=USD
 *
 * Returns latest exchange rates with USD as the canonical base. We proxy a
 * free, key-less source (fawazahmed0/currency-api on jsDelivr) which is
 * extremely reliable and updated daily. A second mirror is used if the
 * primary fails.
 *
 * Response shape:
 *   { base: "USD", rates: { EUR: 0.92, DOP: 60.5, … }, fetchedAt: ISO, source: string }
 */

interface UpstreamRates {
  date: string;
  [code: string]: unknown;
}

const PRIMARY = (base: string) =>
  `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`;
const FALLBACK = (base: string) =>
  `https://latest.currency-api.pages.dev/v1/currencies/${base.toLowerCase()}.json`;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const base = (url.searchParams.get("base") ?? "USD").toUpperCase();

  const result = await tryFetch(base);
  if (!result) {
    return NextResponse.json(
      { error: "Upstream currency API unavailable" },
      { status: 502 },
    );
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

async function tryFetch(
  base: string,
): Promise<{ base: string; rates: Record<string, number>; fetchedAt: string; source: string } | null> {
  for (const [name, build] of [
    ["jsdelivr", PRIMARY],
    ["pages.dev", FALLBACK],
  ] as const) {
    try {
      const res = await fetch(build(base), {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600, tags: [`currency:${base}`] },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as UpstreamRates;
      const raw = data[base.toLowerCase()];
      if (!raw || typeof raw !== "object") continue;
      const rates: Record<string, number> = {};
      for (const [code, value] of Object.entries(raw)) {
        if (typeof value === "number") rates[code.toUpperCase()] = value;
      }
      return {
        base,
        rates,
        fetchedAt: data.date ?? new Date().toISOString(),
        source: name,
      };
    } catch {
      // try next
    }
  }
  return null;
}
