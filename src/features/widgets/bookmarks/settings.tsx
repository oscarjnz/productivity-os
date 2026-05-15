"use client";

import { Field, Segmented } from "@/features/widgets/core/widget-settings";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { BookmarksConfig } from "./config";

const COLUMN_OPTIONS = [
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
];

export function BookmarksSettings({ config, onChange }: WidgetSettingsProps<BookmarksConfig>) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Columns">
        <Segmented
          value={String(config.columns)}
          options={COLUMN_OPTIONS}
          onChange={(v) => onChange({ ...config, columns: Number(v) })}
        />
      </Field>
    </div>
  );
}
