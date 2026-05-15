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
 * Open-Meteo WMO weather codes → emoji + human label.
 * Falls back to nearest decade.
 */
export const WMO_MAP: Record<number, readonly [string, string]> = {
  0: ["☀️", "Clear sky"],
  1: ["🌤", "Mainly clear"],
  2: ["⛅", "Partly cloudy"],
  3: ["☁️", "Overcast"],
  45: ["🌫", "Foggy"],
  48: ["🌫", "Icy fog"],
  51: ["🌦", "Light drizzle"],
  53: ["🌦", "Drizzle"],
  55: ["🌧", "Heavy drizzle"],
  61: ["🌧", "Light rain"],
  63: ["🌧", "Moderate rain"],
  65: ["🌧", "Heavy rain"],
  71: ["🌨", "Light snow"],
  73: ["🌨", "Snow"],
  75: ["❄️", "Heavy snow"],
  80: ["🌦", "Showers"],
  81: ["🌧", "Rain showers"],
  82: ["⛈", "Heavy showers"],
  95: ["⛈", "Thunderstorm"],
  96: ["⛈", "Thunderstorm"],
  99: ["⛈", "Thunderstorm"],
};

export function describeWmo(code: number): readonly [string, string] {
  return WMO_MAP[code] ?? WMO_MAP[Math.floor(code / 10) * 10] ?? ["🌡", "Unknown"];
}
