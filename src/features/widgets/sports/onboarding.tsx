"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Search } from "lucide-react";
import type { SportsConfig } from "./config";
import { SPORT_LABELS } from "./config";
import type { SportKey } from "./types";
import { useLeagueCatalog } from "./use-sports";
import { toast } from "@/stores/toast.store";
import { cn } from "@/lib/utils/cn";

interface OnboardingProps {
  config: SportsConfig;
  onComplete: (next: SportsConfig) => void;
}

type Step = "sports" | "leagues";

const ALL_SPORTS: SportKey[] = ["soccer", "basketball", "baseball", "football", "hockey"];

export function SportsOnboarding({ config, onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("sports");
  const [sports, setSports] = useState<SportKey[]>(config.sports);
  const [leagues, setLeagues] = useState<string[]>(config.leagues);
  const [query, setQuery] = useState("");

  const { data: catalog } = useLeagueCatalog();

  const availableLeagues = useMemo(() => {
    const list = catalog?.leagues ?? [];
    return list
      .filter((l) => sports.includes(l.sport))
      .filter((l) =>
        !query.trim()
          ? true
          : l.name.toLowerCase().includes(query.toLowerCase()) ||
            (l.country?.toLowerCase().includes(query.toLowerCase()) ?? false),
      );
  }, [catalog, sports, query]);

  const toggleSport = (s: SportKey) => {
    setSports((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  };

  const toggleLeague = (id: string) => {
    setLeagues((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  if (step === "sports") {
    return (
      <div className="flex h-full flex-col">
        <div className="px-1 pb-2">
          <h3 className="text-[13px] font-semibold text-[var(--color-text-hi)]">
            ¿Qué deportes sigues?
          </h3>
          <p className="text-[11px] text-[var(--color-text-lo)]">
            Selecciona uno o más. Lo puedes cambiar después.
          </p>
        </div>
        <ul className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {ALL_SPORTS.map((s) => {
            const active = sports.includes(s);
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => toggleSport(s)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)]",
                    "border px-2.5 py-2 text-left transition-colors",
                    active
                      ? "border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-raised)]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        active ? "bg-[var(--color-accent)]" : "bg-[var(--color-text-lo)]",
                      )}
                    />
                    <span className="text-[12.5px] text-[var(--color-text-hi)]">
                      {SPORT_LABELS[s]}
                    </span>
                  </span>
                  {active && (
                    <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex shrink-0 justify-end">
          <button
            type="button"
            disabled={sports.length === 0}
            onClick={() => setStep("leagues")}
            className={cn(
              "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-3 py-1.5",
              "text-[12px] font-medium",
              "bg-[var(--color-accent)] text-white",
              "disabled:opacity-40 active:scale-[0.97]",
            )}
          >
            Siguiente
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  // Step: leagues
  return (
    <div className="flex h-full flex-col">
      <div className="px-1 pb-2">
        <h3 className="text-[13px] font-semibold text-[var(--color-text-hi)]">
          Ligas favoritas
        </h3>
        <p className="text-[11px] text-[var(--color-text-lo)]">
          Las pinearé arriba en la lista de partidos.
        </p>
      </div>
      <div className="relative mb-1.5 shrink-0">
        <Search
          className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--color-text-lo)]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar liga o país…"
          className={cn(
            "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-base)]",
            "py-1.5 pl-7 pr-2 text-[12px] text-[var(--color-text-hi)] outline-none",
            "placeholder:text-[var(--color-text-lo)] focus:border-[var(--color-accent)]",
          )}
        />
      </div>
      <ul className="-mr-1 flex-1 overflow-y-auto pr-1">
        {availableLeagues.length === 0 ? (
          <li className="px-2 py-4 text-center text-[11px] text-[var(--color-text-lo)]">
            Sin coincidencias
          </li>
        ) : (
          availableLeagues.map((l) => {
            const active = leagues.includes(l.id);
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => toggleLeague(l.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5",
                    "text-left transition-colors",
                    active
                      ? "bg-[var(--color-accent-soft)]"
                      : "hover:bg-[var(--color-bg-raised)]",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      aria-hidden
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        active ? "bg-[var(--color-accent)]" : "bg-[var(--color-text-lo)]",
                      )}
                    />
                    <span className="min-w-0 truncate text-[12px] text-[var(--color-text-hi)]">
                      {l.name}
                    </span>
                    {l.country && (
                      <span className="truncate text-[10px] text-[var(--color-text-lo)]">
                        · {l.country}
                      </span>
                    )}
                  </span>
                  {active && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" aria-hidden />
                  )}
                </button>
              </li>
            );
          })
        )}
      </ul>
      <div className="mt-2 flex shrink-0 justify-between gap-2">
        <button
          type="button"
          onClick={() => setStep("sports")}
          className={cn(
            "rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px]",
            "text-[var(--color-text-mid)] hover:text-[var(--color-text-hi)]",
          )}
        >
          Atrás
        </button>
        <button
          type="button"
          disabled={leagues.length === 0}
          onClick={() => {
            onComplete({
              ...config,
              sports,
              leagues,
            });
            toast.success(`Listo · ${leagues.length} ligas guardadas`);
          }}
          className={cn(
            "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-3 py-1.5",
            "text-[12px] font-medium",
            "bg-[var(--color-accent)] text-white",
            "disabled:opacity-40 active:scale-[0.97]",
          )}
        >
          Listo
          <Check className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
