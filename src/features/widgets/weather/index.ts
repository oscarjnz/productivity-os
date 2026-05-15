import { CloudSun } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { WeatherWidget } from "./weather-widget";
import { WeatherSettings } from "./settings";
import { defaultWeatherConfig, type WeatherConfig } from "./config";

export const weatherWidget: WidgetDefinition<WeatherConfig> = {
  type: "weather",
  name: "Weather",
  description: "Current conditions for a location via Open-Meteo.",
  icon: CloudSun,
  category: "personal",
  defaultSize: { w: 5, h: 2 },
  minSize: { w: 3, h: 2 },
  maxSize: { w: 12, h: 4 },
  defaultConfig: defaultWeatherConfig,
  component: WeatherWidget,
  settings: WeatherSettings,
};

export { WeatherWidget } from "./weather-widget";
export { defaultWeatherConfig } from "./config";
export type { WeatherConfig } from "./config";
