"use client";

import { Field, Segmented, TextInput } from "@/features/widgets/core/widget-settings";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { WeatherConfig } from "./config";

const UNIT_OPTIONS = [
  { value: "metric" as const, label: "°C · km/h" },
  { value: "imperial" as const, label: "°F · mph" },
];

export function WeatherSettings({ config, onChange }: WidgetSettingsProps<WeatherConfig>) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Units">
        <Segmented
          value={config.units}
          options={UNIT_OPTIONS}
          onChange={(units) => onChange({ ...config, units })}
        />
      </Field>

      <Field label="City label">
        <TextInput
          value={config.city}
          placeholder="Santo Domingo"
          onChange={(city) => onChange({ ...config, city })}
        />
      </Field>

      <Field label="Coordinates" hint="Open-Meteo lookup. Use https://geocoder.open-meteo.com to find values.">
        <div className="grid grid-cols-2 gap-2">
          <TextInput
            type="number"
            value={String(config.latitude)}
            placeholder="Lat"
            onChange={(v) => onChange({ ...config, latitude: Number(v) || 0 })}
          />
          <TextInput
            type="number"
            value={String(config.longitude)}
            placeholder="Lon"
            onChange={(v) => onChange({ ...config, longitude: Number(v) || 0 })}
          />
        </div>
      </Field>
    </div>
  );
}
