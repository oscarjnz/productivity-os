"use client";

import { getValidAccessToken } from "./oauth";

const API = "https://api.spotify.com/v1/me/player";

class SpotifyControlError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "SpotifyControlError";
  }
}

async function call(
  method: "POST" | "PUT",
  path: string,
  body?: Record<string, unknown>,
): Promise<void> {
  const token = await getValidAccessToken();
  if (!token) throw new SpotifyControlError(401, "Not connected");

  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const res = await fetch(`${API}${path}`, init);

  // 204 = OK with no body (Spotify's standard control response).
  // 202 = command accepted (rare).
  // 404 = NO_ACTIVE_DEVICE — caller surfaces a friendly message.
  if (res.status === 204 || res.status === 202) return;
  if (res.ok) return;

  let msg = `Spotify ${res.status}`;
  try {
    const j = (await res.json()) as { error?: { message?: string } };
    if (j.error?.message) msg = j.error.message;
  } catch {
    // ignore parse error
  }
  throw new SpotifyControlError(res.status, msg);
}

export async function spotifyPrev(): Promise<void> {
  await call("POST", "/previous");
}

export async function spotifyNext(): Promise<void> {
  await call("POST", "/next");
}

export async function spotifyPlay(): Promise<void> {
  await call("PUT", "/play");
}

export async function spotifyPause(): Promise<void> {
  await call("PUT", "/pause");
}

export async function spotifySeek(positionMs: number): Promise<void> {
  const ms = Math.max(0, Math.round(positionMs));
  await call("PUT", `/seek?position_ms=${ms}`);
}

export { SpotifyControlError };
