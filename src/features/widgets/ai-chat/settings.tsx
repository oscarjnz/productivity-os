"use client";

import { Field, Segmented, TextInput } from "@/features/widgets/core/widget-settings";
import { useApiKey } from "./use-api-key";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { AIChatConfig, AIModel } from "./config";

const MODEL_OPTIONS: Array<{ value: AIModel; label: string }> = [
  { value: "claude-haiku-4-5", label: "Haiku" },
  { value: "claude-sonnet-4-5", label: "Sonnet" },
  { value: "claude-opus-4-5", label: "Opus" },
];

export function AIChatSettings({ config, onChange }: WidgetSettingsProps<AIChatConfig>) {
  const { apiKey, setApiKey } = useApiKey();

  return (
    <div className="flex flex-col gap-3">
      <Field label="Model">
        <Segmented
          value={config.model}
          options={MODEL_OPTIONS}
          onChange={(model) => onChange({ ...config, model })}
        />
      </Field>

      <Field label="System prompt" hint="Sets persona/role for every chat.">
        <textarea
          value={config.systemPrompt}
          onChange={(e) => onChange({ ...config, systemPrompt: e.target.value })}
          rows={3}
          className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-hi)] outline-none placeholder:text-[var(--color-text-lo)] focus:border-[var(--color-accent)]"
        />
      </Field>

      <Field label="Max tokens">
        <TextInput
          type="number"
          value={String(config.maxTokens)}
          onChange={(v) => onChange({ ...config, maxTokens: Math.max(64, Number(v) || 1024) })}
        />
      </Field>

      {apiKey && (
        <Field label="API key" hint="Stored only in your browser.">
          <div className="flex items-center justify-between gap-2 text-[12px] text-[var(--color-text-mid)]">
            <code className="truncate text-[11px]">…{apiKey.slice(-6)}</code>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => void setApiKey("")}
              aria-label="Remove API key"
            >
              <Trash2 className="h-3 w-3" aria-hidden />
              Remove
            </Button>
          </div>
        </Field>
      )}
    </div>
  );
}
