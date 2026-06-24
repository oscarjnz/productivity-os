import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/stocks?symbols=AAPL,TSLA,^GSPC&token=<optional finnhub>
 *
 * Keyless by default: quote + intraday sparkline come from Yahoo Finance's
 * public chart endpoint (delayed ~15m). If a Finnhub token is supplied the
 * live quote is taken from Finnhub instead (real-time), while the sparkline
 * still comes from Yahoo. Server-side so we dodge browser CORS and can spoof a
 * browser UA (Yahoo blocks bare datacenter requests).
 */

const MAX_SYMBOLS = 25;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export interface StockQuote {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  currency: string | null;
  /** Intraday close points for the sparkline (may be empty). */
  spark: number[];
}

interface YahooChart {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        currency?: string;
        symbol?: string;
      };
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
    error?: unknown;
  };
}

interface FinnhubQuote {
  c?: number; // current
  pc?: number; // previous close
}

async function yahoo(symbol: string): Promise<StockQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=1d&interval=15m&includePrePost=false`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 30 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as YahooChart;
  const r = data.chart?.result?.[0];
  const meta = r?.meta;
  const price = meta?.regularMarketPrice;
  const prevClose = meta?.chartPreviousClose ?? meta?.previousClose;
  if (typeof price !== "number" || typeof prevClose !== "number") return null;

  const spark = (r?.indicators?.quote?.[0]?.close ?? []).filter(
    (n): n is number => typeof n === "number",
  );
  const change = price - prevClose;
  const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;
  return {
    symbol: meta?.symbol ?? symbol,
    price,
    prevClose,
    change,
    changePct,
    currency: meta?.currency ?? null,
    spark,
  };
}

async function finnhubOverride(symbol: string, token: string): Promise<{ price: number; prevClose: number } | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`,
      { next: { revalidate: 15 } },
    );
    if (!res.ok) return null;
    const q = (await res.json()) as FinnhubQuote;
    if (typeof q.c !== "number" || q.c === 0 || typeof q.pc !== "number") return null;
    return { price: q.c, prevClose: q.pc };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("symbols") ?? "";
  const token = url.searchParams.get("token")?.trim() || null;

  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, MAX_SYMBOLS);

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [], fetchedAt: Date.now() });
  }

  const settled = await Promise.allSettled(
    symbols.map(async (sym) => {
      const base = await yahoo(sym);
      if (!base) return null;
      if (token) {
        const live = await finnhubOverride(sym, token);
        if (live) {
          const change = live.price - live.prevClose;
          return {
            ...base,
            price: live.price,
            prevClose: live.prevClose,
            change,
            changePct: live.prevClose !== 0 ? (change / live.prevClose) * 100 : 0,
          };
        }
      }
      return base;
    }),
  );

  // Preserve the user's symbol order; drop ones that failed to resolve.
  const quotes: StockQuote[] = [];
  settled.forEach((r) => {
    if (r.status === "fulfilled" && r.value) quotes.push(r.value);
  });

  return NextResponse.json(
    { quotes, fetchedAt: Date.now() },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
  );
}
