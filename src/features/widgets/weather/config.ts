import type { LucideIcon } from "lucide-react";
import {
  Sun,
  CloudSun,
  Cloud,
  Cloudy,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  Snowflake,
  CloudLightning,
  Thermometer,
} from "lucide-react";

export interface WeatherConfig {
  latitude: number;
  longitude: number;
  city: string;
  /** "metric" = °C/km·h, "imperial" = °F/mph */
  units: "metric" | "imperial";
}

export const defaultWeatherConfig: WeatherConfig = {
  latitude: 18.4861,
  longitude: -69.9312,
  city: "Santo Domingo",
  units: "metric",
};

/**
 * Open-Meteo WMO weather codes → Lucide icon + human label.
 * Crisp vector glyphs (not emoji) keep the surface consistent with the
 * premium dark UI and render identically on every platform. Falls back to
 * the nearest decade, then to a thermometer.
 */
export const WMO_MAP: Record<number, readonly [LucideIcon, string]> = {
  0: [Sun, "Clear sky"],
  1: [CloudSun, "Mainly clear"],
  2: [CloudSun, "Partly cloudy"],
  3: [Cloudy, "Overcast"],
  45: [CloudFog, "Foggy"],
  48: [CloudFog, "Icy fog"],
  51: [CloudDrizzle, "Light drizzle"],
  53: [CloudDrizzle, "Drizzle"],
  55: [CloudDrizzle, "Heavy drizzle"],
  61: [CloudRain, "Light rain"],
  63: [CloudRain, "Moderate rain"],
  65: [CloudRain, "Heavy rain"],
  71: [CloudSnow, "Light snow"],
  73: [CloudSnow, "Snow"],
  75: [Snowflake, "Heavy snow"],
  80: [CloudRain, "Showers"],
  81: [CloudRain, "Rain showers"],
  82: [CloudLightning, "Heavy showers"],
  95: [CloudLightning, "Thunderstorm"],
  96: [CloudLightning, "Thunderstorm"],
  99: [CloudLightning, "Thunderstorm"],
};

export function describeWmo(code: number): readonly [LucideIcon, string] {
  return WMO_MAP[code] ?? WMO_MAP[Math.floor(code / 10) * 10] ?? [Thermometer, "Unknown"];
}

/** Loose grouping used to tint the weather surface to the conditions. */
export function weatherTone(code: number): "clear" | "cloud" | "rain" | "snow" | "storm" {
  if (code === 0 || code === 1) return "clear";
  if (code >= 95) return "storm";
  if (code >= 71 && code <= 77) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  return "cloud";
}
