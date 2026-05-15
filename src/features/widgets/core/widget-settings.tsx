"use client";

import { forwardRef, type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SettingsButtonProps {
  hasSettings: boolean;
  children: ReactNode;
}

/**
 * Wraps the settings ⚙ button in a popover. The widget's own settings
 * component lives in `children`. If `hasSettings` is false the button is
 * still rendered (greyed out, no click) to keep header layout stable.
 */
export function WidgetSettingsPopover({ hasSettings, children }: SettingsButtonProps) {
  if (!hasSettings) {
    return (
      <button
        type="button"
        disabled
        aria-label="No settings"
        className={cn(
          "flex h-6 w-6 items-center justify-center",
          "rounded-[var(--radius-xs)] text-[var(--color-text-lo)] opacity-30",
        )}
      >
        <Settings2 className="h-3.5 w-3.5" aria-hidden />
      </button>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Widget settings"
          className={cn(
            "flex h-6 w-6 items-center justify-center",
            "rounded-[var(--radius-xs)] text-[var(--color-text-lo)]",
            "hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-mid)]",
            "data-[state=open]:bg-[var(--color-surface-glass)] data-[state=open]:text-[var(--color-text-hi)]",
          )}
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className={cn(
            "z-[var(--z-dropdown)] w-[min(260px,calc(100vw-2rem))] p-3",
            "max-h-[calc(100vh-4rem)] overflow-y-auto",
            "rounded-[var(--radius-md)] glass-hi shadow-[var(--shadow-lg)]",
            "outline-none",
          )}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ============================================================================
// Reusable settings primitives — kept inline so each settings file stays tight
// ============================================================================

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
        {label}
      </label>
      {children}
      {hint && <div className="text-[10.5px] text-[var(--color-text-lo)]">{hint}</div>}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (next: T) => void;
}

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      className="grid gap-1 rounded-[var(--radius-sm)] bg-[var(--color-bg-base)] p-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-[var(--radius-xs)] py-1 text-[11.5px]",
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
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { label, checked, onChange },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-2 py-1",
        "text-[12px] text-[var(--color-text-mid)]",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5",
          "transition-colors duration-[var(--duration-fast)]",
          checked ? "bg-[var(--color-accent)]" : "bg-[var(--color-border-strong)]",
        )}
      >
        <span
          className={cn(
            "block h-4 w-4 rounded-full bg-white shadow-[var(--shadow-sm)]",
            "transition-transform duration-[var(--duration-fast)]",
            "[transition-timing-function:var(--ease-standard)]",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
});

interface TextInputProps {
  value: string;
  placeholder?: string;
  onChange: (next: string) => void;
  type?: "text" | "url" | "number";
}

export function TextInput({ value, placeholder, onChange, type = "text" }: TextInputProps) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-[var(--radius-sm)]",
        "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
        "px-2.5 py-1.5 text-[12.5px] text-[var(--color-text-hi)] outline-none",
        "placeholder:text-[var(--color-text-lo)]",
        "focus:border-[var(--color-accent)]",
        "transition-colors duration-[var(--duration-fast)]",
      )}
    />
  );
}
