import { Music } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { SpotifyWidget } from "./spotify-widget";
import { SpotifySettings } from "./settings";
import { defaultSpotifyConfig, type SpotifyConfig } from "./config";

export const spotifyWidget: WidgetDefinition<SpotifyConfig> = {
  type: "spotify",
  name: "Spotify",
  description: "Now playing via your Spotify app (PKCE OAuth).",
  icon: Music,
  category: "media",
  defaultSize: { w: 5, h: 3 },
  minSize: { w: 4, h: 2 },
  maxSize: { w: 12, h: 6 },
  defaultConfig: defaultSpotifyConfig,
  component: SpotifyWidget,
  settings: SpotifySettings,
};

export type { SpotifyConfig };
