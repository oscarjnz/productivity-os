"use client";

import { Field, Segmented } from "@/features/widgets/core/widget-settings";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { SystemConfig } from "./config";

const POLL_OPTIONS = [
  { value: "2", label: "2s" },
  { value: "5", label: "5s" },
  { value: "10", label: "10s" },
  { value: "30", label: "30s" },
];

export function SystemSettings({ config, onChange }: WidgetSettingsProps<SystemConfig>) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Refresh">
        <Segmented
          value={String(config.pollSeconds)}
          options={POLL_OPTIONS}
          onChange={(v) => onChange({ ...config, pollSeconds: Number(v) })}
        />
      </Field>
    </div>
  );
}
