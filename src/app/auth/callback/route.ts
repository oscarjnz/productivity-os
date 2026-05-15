import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * OAuth + magic-link return URL.
 * Exchanges the ?code=... param for a session cookie, then redirects home.
 *
 * Behind the Apache reverse proxy the Node server only sees the internal
 * 127.0.0.1:3000 address, so we must rebuild the *public* origin from the
 * forwarded headers Apache sends (X-Forwarded-Proto + Host). Falls back to
 * request.url for local dev where there is no proxy.
 */
function publicOrigin(request: NextRequest): string {
  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next") ?? "/";
  const origin = publicOrigin(request);

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_code", origin));
  }

  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.redirect(new URL("/auth/login?error=not_configured", origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, origin),
    );
  }

  return NextResponse.redirect(new URL(nextPath, origin));
}
