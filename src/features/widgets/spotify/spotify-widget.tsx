"use client";

import { memo, useState } from "react";
import { Music, ExternalLink, Pause, Play } from "lucide-react";
import { useSpotifyConnected, useNowPlaying } from "./use-now-playing";
import { startSpotifyAuth } from "./oauth";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
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

function NowPlayingView({ track }: { track: NonNullable<ReturnType<typeof useNowPlaying>["data"]> }) {
  const pct = track.durationMs > 0
    ? Math.min(100, (track.progressMs / track.durationMs) * 100)
    : 0;
  const minSec = (ms: number): string => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

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
            {track.isPlaying ? (
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

      <div className="mt-auto flex flex-col gap-1">
        <div className="h-1 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-[oklch(0.78_0.18_155)]"
            style={{ width: `${pct}%`, transition: "width 1s linear" }}
          />
        </div>
        <div className="flex justify-between text-[10px] tabular text-[var(--color-text-lo)]">
          <span>{minSec(track.progressMs)}</span>
          <span>{minSec(track.durationMs)}</span>
        </div>
      </div>
    </div>
  );
}

function SpotifyWidgetInner({ config }: WidgetProps<SpotifyConfig>) {
  const connected = useSpotifyConnected();
  const { data, isLoading, isError, error } = useNowPlaying(connected);

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
        <Skeleton className="mt-auto h-1 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
        <Music className="h-6 w-6 text-[var(--color-text-lo)]" aria-hidden />
        <div className="text-[12px] text-[var(--color-text-mid)]">Nothing playing</div>
        <div className="text-[10.5px] text-[var(--color-text-lo)]">
          Start a track in Spotify — this updates every 10s.
        </div>
      </div>
    );
  }

  return <NowPlayingView track={data} />;
}

export const SpotifyWidget = memo(SpotifyWidgetInner);
