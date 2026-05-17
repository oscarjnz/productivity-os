"use client";

import { useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { Field, TextInput } from "@/features/widgets/core/widget-settings";
import { Button } from "@/components/ui/button";
import { useApiKey } from "./use-api-key";
import { PROVIDERS, getProvider } from "./providers";
import { resolveAIChatConfig } from "./config";
import { cn } from "@/lib/utils/cn";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { AIChatConfig } from "./config";

const selectCls = cn(
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)]",
  "bg-[var(--color-bg-base)] px-2.5 py-1.5 text-[12.5px] text-[var(--color-text-hi)]",
  "outline-none focus:border-[var(--color-accent)]",
);

export function AIChatSettings({ config, onChange }: WidgetSettingsProps<AIChatConfig>) {
  const cfg = resolveAIChatConfig(config);
  const provider = getProvider(cfg.provider);
  const { apiKey, setApiKey } = useApiKey(cfg.provider);
  const [keyDraft, setKeyDraft] = useState("");

  const switchProvider = (id: string): void => {
    const p = getProvider(id);
    // Reset model to the provider's first suggestion so you're never left
    // pointing a Claude model at OpenAI, etc.
    onChange({ ...cfg, provider: id, model: p.models[0] ?? "", baseUrl: "" });
  };

  return (
    <div className="flex flex-col gap-3">
      <Field label="Provider">
        <select
          value={cfg.provider}
          onChange={(e) => switchProvider(e.target.value)}
          className={selectCls}
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Model" hint="Free text — any model the provider accepts.">
        <input
          list={`models-${cfg.provider}`}
          value={cfg.model}
          onChange={(e) => onChange({ ...cfg, model: e.target.value })}
          placeholder={provider.models[0] ?? "model id"}
          className={selectCls}
        />
        <datalist id={`models-${cfg.provider}`}>
          {provider.models.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </Field>

      {provider.editableBaseUrl && (
        <Field
          label="Base URL"
          hint={`Default: ${provider.defaultBaseUrl}`}
        >
          <TextInput
            value={cfg.baseUrl}
            placeholder={provider.defaultBaseUrl}
            onChange={(baseUrl) => onChange({ ...cfg, baseUrl })}
          />
        </Field>
      )}

      <Field label="System prompt" hint="Sets persona/role for every chat.">
        <textarea
          value={cfg.systemPrompt}
          onChange={(e) => onChange({ ...cfg, systemPrompt: e.target.value })}
          rows={3}
          className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-hi)] outline-none placeholder:text-[var(--color-text-lo)] focus:border-[var(--color-accent)]"
        />
      </Field>

      <Field label="Max tokens">
        <TextInput
          type="number"
          value={String(cfg.maxTokens)}
          onChange={(v) => onChange({ ...cfg, maxTokens: Math.max(64, Number(v) || 1024) })}
        />
      </Field>

      <Field
        label={provider.requiresKey ? "API key" : "API key (optional)"}
        hint="Stored only in this browser, per provider."
      >
        {apiKey ? (
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
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (keyDraft.trim()) {
                void setApiKey(keyDraft.trim());
                setKeyDraft("");
              }
            }}
            className="flex gap-1.5"
          >
            <input
              type="password"
              autoComplete="off"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder={provider.requiresKey ? "Paste key…" : "Optional"}
              className={selectCls}
            />
            <Button type="submit" variant="primary" size="sm" disabled={!keyDraft.trim()}>
              Save
            </Button>
          </form>
        )}
        <a
          href={provider.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--color-accent)] hover:underline"
        >
          Get a {provider.label} key
          <ExternalLink className="h-2.5 w-2.5" aria-hidden />
        </a>
      </Field>
    </div>
  );
}
