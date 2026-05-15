import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Pinged by a VPS cron to keep the Supabase free-tier project from pausing
 * after 7 days of inactivity. Runs the cheapest possible query that still
 * counts as database activity (RLS returns 0 rows for the anon role — the
 * query execution itself is what resets the inactivity timer).
 */
export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { status: "skipped", reason: "supabase_not_configured" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const started = Date.now();
  const { error } = await supabase.from("profiles").select("id").limit(1);

  return NextResponse.json(
    {
      status: error ? "error" : "ok",
      pinged: true,
      ms: Date.now() - started,
      ...(error ? { reason: error.message } : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
