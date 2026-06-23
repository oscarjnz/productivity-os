import { Trophy } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { SportsWidget } from "./sports-widget";
import { SportsSettings } from "./settings";
import { defaultSportsConfig, type SportsConfig } from "./config";

export const sportsWidget: WidgetDefinition<SportsConfig> = {
  type: "sports",
  name: "Sports",
  description: "Live scores, fixtures y resultados — fútbol, NBA, NFL, MLB, NHL, LIDOM.",
  icon: Trophy,
  category: "personal",
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 10, h: 10 },
  defaultConfig: defaultSportsConfig,
  component: SportsWidget,
  settings: SportsSettings,
  supportsRealtime: true,
};

export type { SportsConfig };
