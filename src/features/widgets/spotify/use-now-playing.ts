"use client";

import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db/dexie";
import { getValidAccessToken } from "./oauth";
import { SPOTIFY_TOKEN_META_KEY } from "./config";

export interface NowPlaying {
  isPlaying: boolean;
  trackName: string;
  artists: string[];
  albumName: string;
  albumArt: string | null;
  durationMs: number;
  /** Position the API reported. Combine with `progressFetchedAt` to interpolate. */
  progressMs: number;
  /** Date.now() at the moment we received `progressMs` from Spotify. */
  progressFetchedAt: number;
  href: string | null;
  /** Spotify track URI — used for resume on a fresh device. */
  uri: string | null;
}

interface SpotifyTrackResponse {
  is_playing: boolean;
  progress_ms: number;
  item: {
    name: string;
    duration_ms: number;
    external_urls?: { spotify?: string };
    artists: Array<{ name: string }>;
    uri: string;
    album: {
      name: string;
      images: Array<{ url: string; width?: number; height?: number }>;
    };
  } | null;
}

/** Reactive flag — flips automatically when tokens are written/deleted in Dexie. */
export function useSpotifyConnected(): boolean {
  const row = useLiveQuery(
    async () => {
      const db = getDb();
      if (!db) return null;
      return db.meta.get(SPOTIFY_TOKEN_META_KEY);
    },
    [],
    null,
  );
  return !!row;
}

/**
 * Polls the Spotify "currently playing" endpoint.
 *
 * Cadence rationale: 5s while playing, 30s while paused.
 *
 * Polling alone CANNOT drive a smooth progress bar — Spotify's free-tier API
 * rate is too low to call it every second. The widget interpolates the
 * progress locally between polls using `progressFetchedAt` as the anchor.
 */
export function useNowPlaying(enabled: boolean) {
  return useQuery<NowPlaying | null>({
    queryKey: ["spotify-now-playing"],
    enabled,
    queryFn: async ({ signal }) => {
      const token = await getValidAccessToken();
      if (!token) return null;

      const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedAt = Date.now();

      // 204 = nothing playing
      if (res.status === 204) return null;
      if (res.status === 401) throw new Error("Spotify session expired");
      if (!res.ok) throw new Error(`Spotify ${res.status}`);

      const text = await res.text();
      if (!text) return null;
      const data = JSON.parse(text) as SpotifyTrackResponse;
      if (!data.item) return null;

      return {
        isPlaying: data.is_playing,
        trackName: data.item.name,
        artists: data.item.artists.map((a) => a.name),
        albumName: data.item.album.name,
        albumArt: data.item.album.images[0]?.url ?? null,
        durationMs: data.item.duration_ms,
        progressMs: data.progress_ms,
        progressFetchedAt: fetchedAt,
        href: data.item.external_urls?.spotify ?? null,
        uri: data.item.uri,
      };
    },
    // Poll faster while playing so the displayed progress doesn't drift more
    // than a few seconds from the server. Slow down to 30s while paused so we
    // pick up "user started playing on phone" without hammering the API.
    refetchInterval: (q) => (q.state.data?.isPlaying ? 5_000 : 30_000),
    staleTime: 4_000,
  });
}
