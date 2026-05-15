"use client";

import { Field, TextInput, Segmented } from "@/features/widgets/core/widget-settings";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { GitHubConfig } from "./config";

const LIMIT_OPTIONS = [
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "30", label: "30" },
];

export function GitHubSettings({ config, onChange }: WidgetSettingsProps<GitHubConfig>) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Username" hint="Public events only. No token needed.">
        <TextInput
          value={config.username}
          placeholder="torvalds"
          onChange={(username) => onChange({ ...config, username })}
        />
      </Field>

      <Field label="Show">
        <Segmented
          value={String(config.limit)}
          options={LIMIT_OPTIONS}
          onChange={(v) => onChange({ ...config, limit: Number(v) })}
        />
      </Field>
    </div>
  );
}
