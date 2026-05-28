"use client";

import { memo } from "react";
import { Wind, Droplets, MapPin, CloudOff } from "lucide-react";
import { useWeather } from "./use-weather";
import { describeWmo, type WeatherConfig } from "./config";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type { WidgetProps } from "@/types/widget.types";

function formatTemp(t: number, units: WeatherConfig["units"]): string {
  return `${Math.round(t)}°${units === "imperial" ? "F" : "C"}`;
}

function WeatherWidgetInner({ config }: WidgetProps<WeatherConfig>) {
  const { data, isLoading, isError } = useWeather(config);

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <CloudOff className="h-6 w-6 text-[var(--color-text-lo)]" aria-hidden />
        <div className="text-[12px] text-[var(--color-text-mid)]">Weather unavailable</div>
        <div className="text-[10.5px] text-[var(--color-text-lo)]">
          Network is offline or the service is down.
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    );
  }

  const [emoji, description] = describeWmo(data.weatherCode);
  const speedUnit = data.units === "imperial" ? "mph" : "km/h";

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <div
            className={cn(
              "tabular text-[clamp(2rem,5.5vw,3rem)] font-light leading-none tracking-[-0.04em]",
              "text-[var(--color-text-hi)]",
            )}
          >
            {formatTemp(data.temperature, data.units)}
          </div>
          <div className="mt-1 text-[13px] text-[var(--color-text-mid)]">{description}</div>
        </div>
        <div className="text-[clamp(1.75rem,4vw,2.25rem)] leading-none">{emoji}</div>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-3 text-[11.5px] text-[var(--color-text-lo)]">
        <div className="flex items-center gap-1.5">
          <Droplets className="h-3 w-3" aria-hidden />
          <span className="tabular text-[var(--color-text-mid)]">{data.humidity}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="h-3 w-3" aria-hidden />
          <span className="tabular text-[var(--color-text-mid)]">
            {Math.round(data.windSpeed)} {speedUnit}
          </span>
        </div>
        <div className="flex items-center gap-1.5 justify-self-end">
          <MapPin className="h-3 w-3" aria-hidden />
          <span className="truncate text-[var(--color-text-mid)]">{config.city}</span>
        </div>
      </dl>
    </div>
  );
}

export const WeatherWidget = memo(WeatherWidgetInner);
