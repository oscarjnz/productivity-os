"use client";

import { usePrefsStore, type AccentHue, type Density } from "@/stores/prefs.store";
import { cn } from "@/lib/utils/cn";

const ACCENT_OPTIONS: Array<{ value: AccentHue; label: string; swatch: string }> = [
  { value: "indigo", label: "Indigo", swatch: "oklch(0.68 0.18 270)" },
  { value: "violet", label: "Violet", swatch: "oklch(0.68 0.20 305)" },
  { value: "blue", label: "Blue", swatch: "oklch(0.68 0.16 240)" },
  { value: "teal", label: "Teal", swatch: "oklch(0.72 0.14 195)" },
  { value: "rose", label: "Rose", swatch: "oklch(0.70 0.20 10)" },
  { value: "amber", label: "Amber", swatch: "oklch(0.78 0.16 70)" },
];

const DENSITY_OPTIONS: Array<{ value: Density; label: string }> = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Cozy" },
  { value: "spacious", label: "Roomy" },
];

export function AppearancePanel() {
  const accent = usePrefsStore((s) => s.accent);
  const setAccent = usePrefsStore((s) => s.setAccent);
  const density = usePrefsStore((s) => s.density);
  const setDensity = usePrefsStore((s) => s.setDensity);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const setReducedMotion = usePrefsStore((s) => s.setReducedMotion);

  return (
    <div className="flex flex-col gap-3 px-3 py-2.5">
      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          Accent
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ACCENT_OPTIONS.map((opt) => {
            const active = accent === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAccent(opt.value)}
                aria-label={opt.label}
                title={opt.label}
                className={cn(
                  "h-5 w-5 rounded-full",
                  "transition-transform duration-[var(--duration-fast)]",
                  "[transition-timing-function:var(--ease-standard)]",
                  "hover:scale-110 active:scale-95",
                  "ring-offset-2 ring-offset-[var(--color-bg-overlay)]",
                  active && "ring-2 ring-[var(--color-text-hi)]",
                )}
                style={{ background: opt.swatch }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          Density
        </div>
        <div
          role="radiogroup"
          className="grid grid-cols-3 gap-1 rounded-[var(--radius-sm)] bg-[var(--color-bg-base)] p-0.5"
        >
          {DENSITY_OPTIONS.map((opt) => {
            const active = density === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setDensity(opt.value)}
                className={cn(
                  "rounded-[var(--radius-xs)] py-1 text-[11px]",
                  "transition-colors duration-[var(--duration-fast)]",
                  active
                    ? "bg-[var(--color-bg-overlay)] text-[var(--color-text-hi)]"
                    : "text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-2">
        <span className="text-[12px] text-[var(--color-text-mid)]">Reduced motion</span>
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(e) => setReducedMotion(e.target.checked)}
          className="h-3.5 w-3.5 accent-[var(--color-accent)]"
        />
      </label>
    </div>
  );
}
