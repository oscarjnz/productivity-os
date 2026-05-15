"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import { getDb } from "@/lib/db/dexie";

export const GOOGLE_TOKENS_META_KEY = "google.service_tokens";
export const GOOGLE_CONNECTING_FLAG = "google.connecting";

export const GOOGLE_SERVICE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

export interface GoogleTokenSet {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * Re-runs Google OAuth requesting Calendar + Gmail scopes.
 * access_type=offline + prompt=consent forces a refresh_token to be issued.
 * On return, auth-provider captures the provider tokens (see captureGoogleTokens).
 */
export async function connectGoogleServices(): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error("Supabase not configured");
  sessionStorage.setItem(GOOGLE_CONNECTING_FLAG, "1");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: GOOGLE_SERVICE_SCOPES,
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error) {
    sessionStorage.removeItem(GOOGLE_CONNECTING_FLAG);
    throw error;
  }
}

/**
 * Called by auth-provider on SIGNED_IN. Only persists tokens if the user
 * explicitly initiated the connect flow (flag set) — a normal login must
 * not overwrite broader-scope tokens with basic ones.
 */
export async function captureGoogleTokens(
  providerToken: string | null | undefined,
  providerRefreshToken: string | null | undefined,
): Promise<void> {
  if (sessionStorage.getItem(GOOGLE_CONNECTING_FLAG) !== "1") return;
  sessionStorage.removeItem(GOOGLE_CONNECTING_FLAG);
  if (!providerToken || !providerRefreshToken) return;

  const db = getDb();
  if (!db) return;
  const tokens: GoogleTokenSet = {
    access_token: providerToken,
    refresh_token: providerRefreshToken,
    expires_at: Date.now() + 3500 * 1000, // Google access tokens ~1h
  };
  await db.meta.put({ key: GOOGLE_TOKENS_META_KEY, value: tokens });
}

export async function getValidGoogleToken(): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db.meta.get(GOOGLE_TOKENS_META_KEY);
  if (!row) return null;
  const tokens = row.value as GoogleTokenSet;

  if (Date.now() < tokens.expires_at - 60_000) {
    return tokens.access_token;
  }

  // Refresh via server route (client secret stays server-side)
  const res = await fetch("/api/google/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string; expires_in: number };

  const next: GoogleTokenSet = {
    access_token: data.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  await db.meta.put({ key: GOOGLE_TOKENS_META_KEY, value: next });
  return next.access_token;
}

export async function disconnectGoogleServices(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.meta.delete(GOOGLE_TOKENS_META_KEY);
}
