"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Field } from "@/features/widgets/core/widget-settings";
import { cn } from "@/lib/utils/cn";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { StocksConfig } from "./config";

export function StocksSettings({ config, onChange }: WidgetSettingsProps<StocksConfig>) {
  const [draft, setDraft] = useState("");

  const addSymbol = (): void => {
    const v = draft.trim().toUpperCase();
    if (!v || config.symbols.includes(v)) return;
    onChange({ ...config, symbols: [...config.symbols, v] });
    setDraft("");
  };

  const removeSymbol = (s: string): void => {
    onChange({ ...config, symbols: config.symbols.filter((x) => x !== s) });
  };

  return (
    <div className="flex flex-col gap-3">
      <Field label="Tickers" hint="Yahoo symbols — AAPL, BTC-USD, ^GSPC, EURUSD=X.">
        <div className="flex flex-wrap gap-1">
          {config.symbols.map((s) => (
            <span
              key={s}
              className={cn(
                "inline-flex items-center gap-1 rounded-[var(--radius-xs)]",
                "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
                "px-1.5 py-0.5 text-[11px] tabular text-[var(--color-text-mid)]",
              )}
            >
              {s}
              <button
                type="button"
                onClick={() => removeSymbol(s)}
                aria-label={`Remove ${s}`}
                className="text-[var(--color-text-lo)] hover:text-[var(--color-danger)]"
              >
                <X className="h-2.5 w-2.5" aria-hidden />
              </button>
            </span>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addSymbol();
          }}
          className="mt-1.5 flex gap-1.5"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="GOOGL"
            className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2 py-1 text-[12px] uppercase tabular text-[var(--color-text-hi)] outline-none placeholder:text-[var(--color-text-lo)] focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className={cn(
              "rounded-[var(--radius-sm)] px-2",
              "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
              "border border-[var(--color-accent-border)]",
              "disabled:opacity-40 active:scale-[0.97]",
            )}
          >
            <Plus className="h-3 w-3" aria-hidden />
          </button>
        </form>
      </Field>

      <Field
        label="Finnhub token (optional)"
        hint="Adds real-time quotes. Free key at finnhub.io. Stays in this browser."
      >
        <input
          type="password"
          value={config.token ?? ""}
          autoComplete="off"
          placeholder="Keyless = ~15 min delayed"
          onChange={(e) => onChange({ ...config, token: e.target.value.trim() })}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2.5 py-1.5 text-[12.5px] text-[var(--color-text-hi)] outline-none placeholder:text-[var(--color-text-lo)] focus:border-[var(--color-accent)]"
        />
      </Field>
    </div>
  );
}
