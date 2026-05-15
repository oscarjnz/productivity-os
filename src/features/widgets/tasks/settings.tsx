"use client";

import { Field, Segmented } from "@/features/widgets/core/widget-settings";
import { resolveFilter, type TaskFilter } from "./config";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { TasksConfig } from "./config";

const FILTER_OPTIONS: Array<{ value: TaskFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "done", label: "Done" },
];

export function TasksSettings({ config, onChange }: WidgetSettingsProps<TasksConfig>) {
  const filter = resolveFilter(config);
  return (
    <div className="flex flex-col gap-3">
      <Field label="Default filter">
        <Segmented
          value={filter}
          options={FILTER_OPTIONS}
          onChange={(v) => onChange({ filter: v })}
        />
      </Field>
    </div>
  );
}
