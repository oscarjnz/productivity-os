"use client";

import { getDb } from "@/lib/db/dexie";
import {
  SPOTIFY_PKCE_SESSION_KEY,
  SPOTIFY_SCOPES,
  SPOTIFY_TOKEN_META_KEY,
} from "./config";

export interface SpotifyTokenSet {
  access_token: string;
  refresh_token: string;
  /** Epoch ms when access_token expires. */
  expires_at: number;
  client_id: string;
}

// ===== PKCE helpers =========================================================

function randomString(length: number): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => ("0" + b.toString(16)).slice(-2)).join("");
}

async function sha256(input: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
}

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]!);
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

// ===== Auth flow ============================================================

export function getRedirectUri(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/spotify/callback`;
}

export async function startSpotifyAuth(clientId: string): Promise<void> {
  if (!clientId) throw new Error("Missing Spotify Client ID");

  const verifier = randomString(64);
  const challenge = base64url(await sha256(verifier));
  const state = randomString(16);

  sessionStorage.setItem(
    SPOTIFY_PKCE_SESSION_KEY,
    JSON.stringify({ verifier, state, clientId }),
  );

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
    redirect_uri: getRedirectUri(),
    state,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  error?: string;
  error_description?: string;
}

async function exchangeCode(code: string, verifier: string, clientId: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    client_id: clientId,
    code_verifier: verifier,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as TokenResponse;
  if (!res.ok || json.error) {
    throw new Error(json.error_description ?? json.error ?? `Spotify token ${res.status}`);
  }
  return json;
}

export async function completeSpotifyAuth(code: string, returnedState: string): Promise<void> {
  const raw = sessionStorage.getItem(SPOTIFY_PKCE_SESSION_KEY);
  if (!raw) throw new Error("Missing PKCE state");
  const { verifier, state, clientId } = JSON.parse(raw) as {
    verifier: string;
    state: string;
    clientId: string;
  };
  if (state !== returnedState) throw new Error("State mismatch");

  const tokens = await exchangeCode(code, verifier, clientId);

  const tokenSet: SpotifyTokenSet = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    client_id: clientId,
  };

  const db = getDb();
  if (db) await db.meta.put({ key: SPOTIFY_TOKEN_META_KEY, value: tokenSet });
  sessionStorage.removeItem(SPOTIFY_PKCE_SESSION_KEY);
}

async function refreshToken(tokenSet: SpotifyTokenSet): Promise<SpotifyTokenSet> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokenSet.refresh_token,
    client_id: tokenSet.client_id,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as TokenResponse;
  if (!res.ok || json.error) {
    throw new Error(json.error_description ?? json.error ?? `Spotify refresh ${res.status}`);
  }

  const next: SpotifyTokenSet = {
    access_token: json.access_token,
    refresh_token: json.refresh_token ?? tokenSet.refresh_token, // Spotify may rotate or not
    expires_at: Date.now() + json.expires_in * 1000,
    client_id: tokenSet.client_id,
  };
  const db = getDb();
  if (db) await db.meta.put({ key: SPOTIFY_TOKEN_META_KEY, value: next });
  return next;
}

/**
 * Returns a valid access token, refreshing if needed.
 * Returns null if no tokens are stored.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db.meta.get(SPOTIFY_TOKEN_META_KEY);
  if (!row) return null;
  let tokenSet = row.value as SpotifyTokenSet;

  // Refresh 60s before expiry to avoid race with API call
  if (Date.now() > tokenSet.expires_at - 60_000) {
    tokenSet = await refreshToken(tokenSet);
  }
  return tokenSet.access_token;
}

export async function disconnectSpotify(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.meta.delete(SPOTIFY_TOKEN_META_KEY);
}

export async function isSpotifyConnected(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const row = await db.meta.get(SPOTIFY_TOKEN_META_KEY);
  return !!row;
}
