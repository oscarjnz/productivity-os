"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Field, Segmented } from "@/features/widgets/core/widget-settings";
import { cn } from "@/lib/utils/cn";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { CryptoConfig, CryptoCurrency } from "./config";

const CURRENCY_OPTIONS: Array<{ value: CryptoCurrency; label: string }> = [
  { value: "usd", label: "USD" },
  { value: "eur", label: "EUR" },
  { value: "btc", label: "BTC" },
];

export function CryptoSettings({ config, onChange }: WidgetSettingsProps<CryptoConfig>) {
  const [draft, setDraft] = useState("");

  const addCoin = (): void => {
    const v = draft.trim().toLowerCase();
    if (!v || config.coins.includes(v)) return;
    onChange({ ...config, coins: [...config.coins, v] });
    setDraft("");
  };

  const removeCoin = (id: string): void => {
    onChange({ ...config, coins: config.coins.filter((c) => c !== id) });
  };

  return (
    <div className="flex flex-col gap-3">
      <Field label="Currency">
        <Segmented
          value={config.currency}
          options={CURRENCY_OPTIONS}
          onChange={(currency) => onChange({ ...config, currency })}
        />
      </Field>

      <Field label="Coins" hint="CoinGecko IDs — e.g. bitcoin, solana.">
        <div className="flex flex-wrap gap-1">
          {config.coins.map((c) => (
            <span
              key={c}
              className={cn(
                "inline-flex items-center gap-1 rounded-[var(--radius-xs)]",
                "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
                "px-1.5 py-0.5 text-[11px] text-[var(--color-text-mid)]",
              )}
            >
              {c}
              <button
                type="button"
                onClick={() => removeCoin(c)}
                aria-label={`Remove ${c}`}
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
            addCoin();
          }}
          className="mt-1.5 flex gap-1.5"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="cardano"
            className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2 py-1 text-[12px] text-[var(--color-text-hi)] outline-none placeholder:text-[var(--color-text-lo)] focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className={cn(
              "rounded-[var(--radius-sm)] px-2",
              "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
              "border border-[oklch(0.68_0.18_270/0.2)]",
              "disabled:opacity-40 active:scale-[0.97]",
            )}
          >
            <Plus className="h-3 w-3" aria-hidden />
          </button>
        </form>
      </Field>
    </div>
  );
}
