"use client";

import { useEffect, useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { useSpotifyConnected } from "./use-now-playing";
import { disconnectSpotify, getRedirectUri } from "./oauth";
import { Field, TextInput } from "@/features/widgets/core/widget-settings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { SpotifyConfig } from "./config";

export function SpotifySettings({ config, onChange }: WidgetSettingsProps<SpotifyConfig>) {
  const connected = useSpotifyConnected();
  const [redirect, setRedirect] = useState("");

  useEffect(() => {
    setRedirect(getRedirectUri());
  }, []);

  const copyRedirect = (): void => {
    void navigator.clipboard.writeText(redirect);
  };

  return (
    <div className="flex flex-col gap-3">
      <Field
        label="Client ID"
        hint="From developer.spotify.com → your app."
      >
        <TextInput
          value={config.clientId}
          placeholder="32-char hex"
          onChange={(clientId) => onChange({ ...config, clientId })}
        />
      </Field>

      <Field label="Redirect URI" hint="Paste this in your Spotify app's settings.">
        <button
          type="button"
          onClick={copyRedirect}
          className={cn(
            "w-full truncate rounded-[var(--radius-sm)]",
            "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
            "px-2.5 py-1.5 text-left text-[11px] font-mono text-[var(--color-text-mid)]",
            "hover:border-[var(--color-border-strong)]",
          )}
          title="Click to copy"
        >
          {redirect || "—"}
        </button>
      </Field>

      <div className="flex items-center justify-between gap-2 pt-1">
        <a
          href="https://developer.spotify.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-[var(--color-accent)] hover:underline"
        >
          Spotify dashboard
          <ExternalLink className="h-2.5 w-2.5" aria-hidden />
        </a>
        {connected && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => void disconnectSpotify()}
          >
            <Trash2 className="h-3 w-3" aria-hidden />
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
}
