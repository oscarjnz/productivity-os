"use client";

import { Field } from "@/features/widgets/core/widget-settings";
import { NOTE_THEMES } from "./config";
import { cn } from "@/lib/utils/cn";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { NotesConfig } from "./config";

export function NotesSettings({ config, onChange }: WidgetSettingsProps<NotesConfig>) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Default color" hint="Color of new notes. You can cycle per-note from the dot.">
        <div className="flex flex-wrap gap-1.5">
          {NOTE_THEMES.map((theme, idx) => {
            const active = config.defaultColorIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                aria-label={`Color ${idx + 1}`}
                onClick={() => onChange({ ...config, defaultColorIndex: idx })}
                className={cn(
                  "h-6 w-6 rounded-full transition-transform",
                  "hover:scale-110 active:scale-95",
                  "ring-offset-2 ring-offset-[var(--color-bg-overlay)]",
                  active && "ring-2 ring-[var(--color-text-hi)]",
                )}
                style={{ background: theme.dot }}
              />
            );
          })}
        </div>
      </Field>
    </div>
  );
}
