"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Field } from "@/features/widgets/core/widget-settings";
import { cn } from "@/lib/utils/cn";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { CurrencyConfig, CurrencyCode } from "./config";
import { ALL_CURRENCIES, CURRENCY_META } from "./config";

export function CurrencySettings({ config, onChange }: WidgetSettingsProps<CurrencyConfig>) {
  const [draftFrom, setDraftFrom] = useState<CurrencyCode>("USD");
  const [draftTo, setDraftTo] = useState<CurrencyCode>("DOP");

  const addPair = () => {
    if (draftFrom === draftTo) return;
    const exists = config.pairs.some((p) => p.from === draftFrom && p.to === draftTo);
    if (exists) return;
    onChange({ ...config, pairs: [...config.pairs, { from: draftFrom, to: draftTo }] });
  };

  const removePair = (i: number) => {
    onChange({ ...config, pairs: config.pairs.filter((_, j) => j !== i) });
  };

  return (
    <div className="flex flex-col gap-3">
      <Field label="Moneda base">
        <select
          value={config.base}
          onChange={(e) => onChange({ ...config, base: e.target.value as CurrencyCode })}
          className={cn(
            "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)]",
            "bg-[var(--color-bg-base)] px-2 py-1.5",
            "text-[12px] text-[var(--color-text-hi)] outline-none",
            "focus:border-[var(--color-accent)]",
          )}
        >
          {ALL_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {CURRENCY_META[c].flag} {c} · {CURRENCY_META[c].name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Pares de conversión">
        <ul className="flex flex-col gap-1">
          {config.pairs.map((p, i) => (
            <li
              key={`${p.from}-${p.to}-${i}`}
              className="flex items-center justify-between gap-2 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-1.5 py-1"
            >
              <span className="text-[11.5px] text-[var(--color-text-mid)]">
                {CURRENCY_META[p.from].flag} {p.from} → {CURRENCY_META[p.to].flag} {p.to}
              </span>
              <button
                type="button"
                onClick={() => removePair(i)}
                aria-label="Quitar"
                className="text-[var(--color-text-lo)] hover:text-[var(--color-danger)]"
              >
                <X className="h-2.5 w-2.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-1.5 flex gap-1">
          <select
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value as CurrencyCode)}
            className={cn(
              "flex-1 rounded-[var(--radius-xs)] border border-[var(--color-border)]",
              "bg-[var(--color-bg-base)] px-1.5 py-1 text-[11px] text-[var(--color-text-hi)] outline-none",
            )}
          >
            {ALL_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="self-center text-[10px] text-[var(--color-text-lo)]">→</span>
          <select
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value as CurrencyCode)}
            className={cn(
              "flex-1 rounded-[var(--radius-xs)] border border-[var(--color-border)]",
              "bg-[var(--color-bg-base)] px-1.5 py-1 text-[11px] text-[var(--color-text-hi)] outline-none",
            )}
          >
            {ALL_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addPair}
            className={cn(
              "rounded-[var(--radius-xs)] px-2",
              "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
              "border border-[oklch(0.68_0.18_270/0.2)]",
              "active:scale-[0.97]",
            )}
          >
            <Plus className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </Field>
    </div>
  );
}
