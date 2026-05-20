"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Music, ExternalLink, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSpotifyConnected, useNowPlaying, type NowPlaying } from "./use-now-playing";
import { startSpotifyAuth } from "./oauth";
import {
  spotifyNext,
  spotifyPause,
  spotifyPlay,
  spotifyPrev,
  spotifySeek,
  SpotifyControlError,
} from "./controls";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/stores/toast.store";
import type { WidgetProps } from "@/types/widget.types";
import type { SpotifyConfig } from "./config";

function ConnectGate({ clientId }: { clientId: string }) {
  const [error, setError] = useState<string | null>(null);
  const handleConnect = async (): Promise<void> => {
    try {
      await startSpotifyAuth(clientId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  if (!clientId.trim()) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
        <Music className="h-6 w-6 text-[var(--color-text-lo)]" aria-hidden />
        <div className="text-[12px] text-[var(--color-text-mid)]">No Client ID set</div>
        <div className="text-[10.5px] leading-snug text-[var(--color-text-lo)]">
          Open ⚙ and paste your Spotify app Client ID.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <Music className="h-6 w-6 text-[var(--color-text-lo)]" aria-hidden />
      <div className="flex flex-col gap-1">
        <div className="text-[12.5px] text-[var(--color-text-hi)]">Connect Spotify</div>
        <div className="text-[10.5px] leading-snug text-[var(--color-text-lo)]">
          PKCE OAuth — tokens stay in your browser.
        </div>
      </div>
      <button
        type="button"
        onClick={() => void handleConnect()}
        className={cn(
          "rounded-[var(--radius-sm)] px-3 py-1.5",
          "bg-[oklch(0.72_0.18_155/0.15)] text-[oklch(0.78_0.18_155)]",
          "border border-[oklch(0.72_0.18_155/0.3)]",
          "text-[12px] font-medium",
          "transition-[background-color] duration-[var(--duration-fast)]",
          "hover:bg-[oklch(0.72_0.18_155/0.22)] active:scale-[0.97]",
        )}
      >
        Connect
      </button>
      {error && (
        <div className="text-[10.5px] text-[var(--color-danger)]">{error}</div>
      )}
    </div>
  );
}

function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Smooth progress driver: ticks at ~4 Hz so the bar moves visibly without
 * burning CPU. requestAnimationFrame would be 60 Hz which is wasteful for a
 * pixel-level progress bar. The actual position is computed from the last
 * server-anchored progressMs + elapsed wall clock since progressFetchedAt.
 */
function useLiveProgress(
  data: NowPlaying | null | undefined,
  /** When the user is scrubbing, freeze the live tick at `overrideMs`. */
  overrideMs: number | null,
): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!data || !data.isPlaying || overrideMs !== null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [data, overrideMs]);

  if (!data) return 0;
  if (overrideMs !== null) return overrideMs;
  if (!data.isPlaying) return data.progressMs;
  const elapsed = now - data.progressFetchedAt;
  return Math.min(data.durationMs, data.progressMs + Math.max(0, elapsed));
}

interface NowPlayingViewProps {
  track: NowPlaying;
  /** Optimistic isPlaying toggle while the API call resolves. */
  optimisticPlaying: boolean | null;
  setOptimisticPlaying: (v: boolean | null) => void;
}

function NowPlayingView({ track, optimisticPlaying, setOptimisticPlaying }: NowPlayingViewProps) {
  const qc = useQueryClient();
  const [scrubMs, setScrubMs] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  const isPlaying = optimisticPlaying ?? track.isPlaying;
  const liveMs = useLiveProgress(track, scrubMs);
  const pct = track.durationMs > 0 ? Math.min(100, (liveMs / track.durationMs) * 100) : 0;

  const refresh = useCallback((): void => {
    void qc.invalidateQueries({ queryKey: ["spotify-now-playing"] });
  }, [qc]);

  const handleError = useCallback((e: unknown): void => {
    const msg =
      e instanceof SpotifyControlError && e.status === 404
        ? "No active Spotify device — open the Spotify app first."
        : e instanceof Error
          ? e.message
          : "Spotify error";
    toast.error(msg, "spotify-control-error");
  }, []);

  const doAction = useCallback(
    async (action: () => Promise<void>, optimisticUpdate?: () => void): Promise<void> => {
      if (busy) return;
      setBusy(true);
      if (optimisticUpdate) optimisticUpdate();
      try {
        await action();
      } catch (e) {
        handleError(e);
        // Roll back optimistic state on failure.
        setOptimisticPlaying(null);
      } finally {
        setBusy(false);
        // Confirm by re-polling — server is the source of truth.
        setTimeout(refresh, 350);
      }
    },
    [busy, handleError, refresh, setOptimisticPlaying],
  );

  const onPrev = useCallback(() => {
    void doAction(spotifyPrev);
  }, [doAction]);

  const onNext = useCallback(() => {
    void doAction(spotifyNext);
  }, [doAction]);

  const onPlayPause = useCallback(() => {
    const target = !isPlaying;
    void doAction(
      target ? spotifyPlay : spotifyPause,
      () => setOptimisticPlaying(target),
    );
  }, [doAction, isPlaying, setOptimisticPlaying]);

  // --- Seek (click + drag on the progress bar) -----------------------------
  const posFromPointer = useCallback(
    (clientX: number): number => {
      const bar = barRef.current;
      if (!bar) return 0;
      const rect = bar.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      const clamped = Math.max(0, Math.min(1, ratio));
      return Math.round(clamped * track.durationMs);
    },
    [track.durationMs],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>): void => {
      e.preventDefault();
      const target = e.currentTarget;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Some browsers throw under iframes; ignore.
      }
      setScrubMs(posFromPointer(e.clientX));
    },
    [posFromPointer],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>): void => {
      if (scrubMs === null) return;
      setScrubMs(posFromPointer(e.clientX));
    },
    [posFromPointer, scrubMs],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>): void => {
      if (scrubMs === null) return;
      const target = scrubMs;
      setScrubMs(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      void doAction(() => spotifySeek(target));
    },
    [scrubMs, doAction],
  );

  const onPointerCancel = useCallback(() => {
    setScrubMs(null);
  }, []);

  const handleAction = useMemo(
    () => ({
      onPrev,
      onNext,
      onPlayPause,
    }),
    [onPrev, onNext, onPlayPause],
  );

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-start gap-3">
        {track.albumArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.albumArt}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
            className="h-12 w-12 shrink-0 rounded-[var(--radius-sm)] object-cover shadow-[var(--shadow-md)]"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-bg-base)]">
            <Music className="h-5 w-5 text-[var(--color-text-lo)]" aria-hidden />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {isPlaying ? (
              <Play className="h-3 w-3 shrink-0 text-[oklch(0.78_0.18_155)]" aria-hidden />
            ) : (
              <Pause className="h-3 w-3 shrink-0 text-[var(--color-text-lo)]" aria-hidden />
            )}
            <span className="truncate text-[13px] font-medium text-[var(--color-text-hi)]">
              {track.trackName}
            </span>
          </div>
          <div className="truncate text-[11.5px] text-[var(--color-text-mid)]">
            {track.artists.join(", ")}
          </div>
          <div className="truncate text-[10.5px] text-[var(--color-text-lo)]">
            {track.albumName}
          </div>
        </div>
        {track.href && (
          <a
            href={track.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in Spotify"
            className="text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        )}
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          aria-label="Previous"
          onClick={handleAction.onPrev}
          disabled={busy}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full",
            "text-[var(--color-text-mid)] hover:text-[var(--color-text-hi)]",
            "transition-colors duration-[var(--duration-fast)]",
            "disabled:opacity-50",
          )}
        >
          <SkipBack className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={handleAction.onPlayPause}
          disabled={busy}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            "bg-[oklch(0.78_0.18_155)] text-[var(--color-bg-base)]",
            "transition-[transform,background-color] duration-[var(--duration-fast)]",
            "hover:bg-[oklch(0.82_0.18_155)] active:scale-[0.94]",
            "disabled:opacity-60",
          )}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5 fill-current" aria-hidden />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
          )}
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={handleAction.onNext}
          disabled={busy}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full",
            "text-[var(--color-text-mid)] hover:text-[var(--color-text-hi)]",
            "transition-colors duration-[var(--duration-fast)]",
            "disabled:opacity-50",
          )}
        >
          <SkipForward className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Seekable progress bar */}
      <div className="mt-auto flex flex-col gap-1">
        <div
          ref={barRef}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={track.durationMs}
          aria-valuenow={liveMs}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              const next = Math.max(0, liveMs - 5_000);
              setScrubMs(null);
              void doAction(() => spotifySeek(next));
            } else if (e.key === "ArrowRight") {
              const next = Math.min(track.durationMs, liveMs + 5_000);
              setScrubMs(null);
              void doAction(() => spotifySeek(next));
            }
          }}
          className={cn(
            "group/seek relative h-2 cursor-pointer rounded-full bg-[var(--color-border)]",
            "touch-none select-none",
          )}
        >
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full bg-[oklch(0.78_0.18_155)]",
              scrubMs === null && isPlaying ? "transition-[width] duration-[250ms] ease-linear" : "",
            )}
            style={{ width: `${pct}%` }}
          />
          <div
            className={cn(
              "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full",
              "bg-[oklch(0.78_0.18_155)] shadow-[var(--shadow-md)]",
              "opacity-0 group-hover/seek:opacity-100",
              scrubMs !== null && "opacity-100 scale-110",
              "transition-[opacity,transform] duration-[var(--duration-fast)]",
            )}
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] tabular text-[var(--color-text-lo)]">
          <span>{formatTime(liveMs)}</span>
          <span>{formatTime(track.durationMs)}</span>
        </div>
      </div>
    </div>
  );
}

function SpotifyWidgetInner({ config }: WidgetProps<SpotifyConfig>) {
  const connected = useSpotifyConnected();
  const { data, isLoading, isError, error } = useNowPlaying(connected);
  const [optimisticPlaying, setOptimisticPlaying] = useState<boolean | null>(null);

  // Clear optimistic state when the server confirms (or differs) on next poll.
  useEffect(() => {
    if (data && optimisticPlaying !== null && data.isPlaying === optimisticPlaying) {
      setOptimisticPlaying(null);
    }
  }, [data, optimisticPlaying]);

  if (!connected) {
    return <ConnectGate clientId={config.clientId} />;
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
        <div className="text-[12px] text-[var(--color-danger)]">
          {error instanceof Error ? error.message : "Spotify error"}
        </div>
        <div className="text-[10.5px] text-[var(--color-text-lo)]">
          Re-connect from ⚙ if this persists.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <Skeleton className="mt-auto h-2 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
        <Music className="h-6 w-6 text-[var(--color-text-lo)]" aria-hidden />
        <div className="text-[12px] text-[var(--color-text-mid)]">Nothing playing</div>
        <div className="text-[10.5px] text-[var(--color-text-lo)]">
          Start a track in Spotify — controls activate once playback begins.
        </div>
      </div>
    );
  }

  return (
    <NowPlayingView
      track={data}
      optimisticPlaying={optimisticPlaying}
      setOptimisticPlaying={setOptimisticPlaying}
    />
  );
}

export const SpotifyWidget = memo(SpotifyWidgetInner);
