"use client";

import { useQuery } from "@tanstack/react-query";
import type { WeatherConfig } from "./config";

export interface WeatherSnapshot {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  units: WeatherConfig["units"];
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m: number;
    weathercode: number;
    windspeed_10m: number;
    relativehumidity_2m: number;
  };
}

function buildUrl(config: WeatherConfig): string {
  const params = new URLSearchParams({
    latitude: String(config.latitude),
    longitude: String(config.longitude),
    current: "temperature_2m,weathercode,windspeed_10m,relativehumidity_2m",
    timezone: "auto",
    temperature_unit: config.units === "imperial" ? "fahrenheit" : "celsius",
    windspeed_unit: config.units === "imperial" ? "mph" : "kmh",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function useWeather(config: WeatherConfig) {
  return useQuery<WeatherSnapshot>({
    queryKey: ["weather", config.latitude, config.longitude, config.units],
    queryFn: async ({ signal }) => {
      const res = await fetch(buildUrl(config), { signal });
      if (!res.ok) throw new Error(`Weather API ${res.status}`);
      const data = (await res.json()) as OpenMeteoResponse;
      if (!data.current) throw new Error("Malformed weather response");
      return {
        temperature: data.current.temperature_2m,
        weatherCode: data.current.weathercode,
        windSpeed: data.current.windspeed_10m,
        humidity: data.current.relativehumidity_2m,
        units: config.units,
      };
    },
    staleTime: 30 * 60_000, // 30 min
    gcTime: 60 * 60_000,
  });
}
