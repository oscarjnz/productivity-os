import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Exchanges a Google refresh_token for a fresh access_token.
 * The client secret is server-only — never exposed to the browser.
 */
export async function POST(request: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 501 });
  }

  let refreshToken: string;
  try {
    const body = (await request.json()) as { refresh_token?: string };
    if (!body.refresh_token) throw new Error("missing refresh_token");
    refreshToken = body.refresh_token;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    return NextResponse.json(
      { error: data.error_description ?? data.error ?? "Refresh failed" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { access_token: data.access_token, expires_in: data.expires_in ?? 3600 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
