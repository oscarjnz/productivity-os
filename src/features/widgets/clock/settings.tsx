"use client";

import { Field, Segmented, Toggle, TextInput } from "@/features/widgets/core/widget-settings";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { ClockConfig } from "./config";

const FORMAT_OPTIONS = [
  { value: "24h" as const, label: "24h" },
  { value: "12h" as const, label: "12h" },
];

export function ClockSettings({ config, onChange }: WidgetSettingsProps<ClockConfig>) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Format">
        <Segmented
          value={config.format}
          options={FORMAT_OPTIONS}
          onChange={(format) => onChange({ ...config, format })}
        />
      </Field>

      <Field label="Display">
        <Toggle
          label="Show seconds"
          checked={config.showSeconds}
          onChange={(showSeconds) => onChange({ ...config, showSeconds })}
        />
        <Toggle
          label="Show date"
          checked={config.showDate}
          onChange={(showDate) => onChange({ ...config, showDate })}
        />
      </Field>

      <Field label="Timezone" hint="IANA name. Empty = browser default.">
        <TextInput
          value={config.timezone}
          placeholder="America/Santo_Domingo"
          onChange={(timezone) => onChange({ ...config, timezone })}
        />
      </Field>
    </div>
  );
}
