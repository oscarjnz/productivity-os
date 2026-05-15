import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Liveness probe for uptime monitors / NGINX / PM2.
 * Intentionally cheap: no DB, no auth.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      uptime: Math.floor(process.uptime()),
      ts: Date.now(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
