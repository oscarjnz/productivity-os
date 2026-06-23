"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, Search, X } from "lucide-react";
import { Field, Segmented } from "@/features/widgets/core/widget-settings";
import { cn } from "@/lib/utils/cn";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { SportsConfig } from "./config";
import { SPORT_EMOJI, SPORT_LABELS, defaultSportsConfig } from "./config";
import type { SportKey } from "./types";
import { useLeagueCatalog } from "./use-sports";

const ALL_SPORTS: SportKey[] = ["soccer", "basketball", "baseball", "football", "hockey"];

const VARIANT_OPTIONS = [
  { value: "auto" as const, label: "Auto" },
  { value: "ticker" as const, label: "Mini" },
  { value: "list" as const, label: "Lista" },
  { value: "panel" as const, label: "Panel" },
];

export function SportsSettings({ config, onChange }: WidgetSettingsProps<SportsConfig>) {
  const [query, setQuery] = useState("");
  const { data: catalog } = useLeagueCatalog();

  const filteredLeagues = useMemo(() => {
    const list = catalog?.leagues ?? [];
    return list
      .filter((l) => config.sports.includes(l.sport))
      .filter((l) =>
        !query.trim()
          ? true
          : l.name.toLowerCase().includes(query.toLowerCase()) ||
            (l.country?.toLowerCase().includes(query.toLowerCase()) ?? false),
      );
  }, [catalog, config.sports, query]);

  const toggleSport = (s: SportKey) => {
    const next = config.sports.includes(s)
      ? config.sports.filter((x) => x !== s)
      : [...config.sports, s];
    onChange({ ...config, sports: next });
  };

  const toggleLeague = (id: string) => {
    const next = config.leagues.includes(id)
      ? config.leagues.filter((x) => x !== id)
      : [...config.leagues, id];
    onChange({ ...config, leagues: next });
  };

  return (
    <div className="flex flex-col gap-3">
      <Field label="Variante">
        <Segmented
          value={config.variant}
          options={VARIANT_OPTIONS}
          onChange={(variant) => onChange({ ...config, variant })}
        />
      </Field>

      <Field label="Deportes">
        <div className="flex flex-wrap gap-1">
          {ALL_SPORTS.map((s) => {
            const active = config.sports.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSport(s)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
                  "border transition-colors",
                  active
                    ? "border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-mid)]",
                )}
              >
                <span aria-hidden>{SPORT_EMOJI[s]}</span>
                {SPORT_LABELS[s]}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Ligas favoritas" hint="Click para pin/unpin.">
        <div className="relative mb-1.5">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--color-text-lo)]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar liga…"
            className={cn(
              "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-base)]",
              "py-1 pl-7 pr-2 text-[11.5px] text-[var(--color-text-hi)] outline-none",
              "placeholder:text-[var(--color-text-lo)] focus:border-[var(--color-accent)]",
            )}
          />
        </div>
        <ul className="max-h-44 overflow-y-auto pr-1">
          {filteredLeagues.map((l) => {
            const active = config.leagues.includes(l.id);
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => toggleLeague(l.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-[var(--radius-xs)] px-1.5 py-1",
                    "text-left transition-colors",
                    active
                      ? "bg-[var(--color-accent-soft)]"
                      : "hover:bg-[var(--color-bg-raised)]",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-1">
                    <span aria-hidden className="text-[10px]">{SPORT_EMOJI[l.sport]}</span>
                    <span className="truncate text-[11.5px] text-[var(--color-text-hi)]">
                      {l.name}
                    </span>
                    {l.country && (
                      <span className="truncate text-[10px] text-[var(--color-text-lo)]">
                        · {l.country}
                      </span>
                    )}
                  </span>
                  {active ? (
                    <Check className="h-3 w-3 shrink-0 text-[var(--color-accent)]" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </Field>

      {config.teams.length > 0 && (
        <Field label="Equipos pineados">
          <div className="flex flex-wrap gap-1">
            {config.teams.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-1.5 py-0.5 text-[10.5px] text-[var(--color-text-mid)]"
              >
                {id}
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...config,
                      teams: config.teams.filter((t) => t !== id),
                    })
                  }
                  aria-label={`Quitar ${id}`}
                  className="text-[var(--color-text-lo)] hover:text-[var(--color-danger)]"
                >
                  <X className="h-2.5 w-2.5" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        </Field>
      )}

      <button
        type="button"
        onClick={() => onChange({ ...defaultSportsConfig, onboarded: false })}
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded-[var(--radius-sm)] py-1.5",
          "text-[11px] text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]",
        )}
      >
        <RotateCcw className="h-3 w-3" aria-hidden />
        Reiniciar onboarding
      </button>
    </div>
  );
}
