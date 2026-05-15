"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Command, Plus, Palette, X, Sparkles } from "lucide-react";
import { usePrefsStore } from "@/stores/prefs.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";

/**
 * First-run welcome banner. Self-dismissable, persisted in prefs (and synced
 * via the existing prefs sync engine once the user signs in).
 */
export function WelcomeBanner() {
  const hasSeen = usePrefsStore((s) => s.hasSeenOnboarding);
  const setSeen = usePrefsStore((s) => s.setHasSeenOnboarding);
  const openPalette = useUIStore((s) => s.openPalette);

  // Defer to mount so the persisted value has loaded before deciding
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready || hasSeen) return null;

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: duration.base, ease: easing.standard }}
        className={cn(
          "relative mb-4 overflow-hidden rounded-[var(--radius-lg)] glass-hi",
          "border border-[var(--color-border-strong)]",
        )}
      >
        <button
          type="button"
          onClick={() => setSeen(true)}
          aria-label="Dismiss"
          className={cn(
            "absolute right-3 top-3 z-10",
            "flex h-6 w-6 items-center justify-center",
            "rounded-[var(--radius-xs)] text-[var(--color-text-lo)]",
            "hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-mid)]",
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>

        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:gap-6">
          <div className="flex shrink-0 items-start gap-3">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]",
                "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
              )}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--color-text-hi)]">
                Welcome to your dashboard
              </h2>
              <p className="text-[12px] text-[var(--color-text-mid)]">
                Three things worth knowing.
              </p>
            </div>
          </div>

          <ul className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
            <Hint
              icon={<Command className="h-3.5 w-3.5" aria-hidden />}
              title="Command palette"
              kbd="⌘K"
              onClick={openPalette}
            >
              Add widgets, switch modes, jump anywhere.
            </Hint>
            <Hint
              icon={<Plus className="h-3.5 w-3.5" aria-hidden />}
              title="Add widgets"
            >
              Clock, weather, tasks, notes, GitHub, AI chat… mix and match.
            </Hint>
            <Hint
              icon={<Palette className="h-3.5 w-3.5" aria-hidden />}
              title="Personalize"
            >
              Avatar → accent color, density, dark feel.
            </Hint>
          </ul>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}

interface HintProps {
  icon: React.ReactNode;
  title: string;
  kbd?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

function Hint({ icon, title, kbd, onClick, children }: HintProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1.5 rounded-[var(--radius-md)] p-3 text-left",
        "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
        "transition-[border-color,background-color] duration-[var(--duration-fast)]",
        onClick && "cursor-pointer hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-hi)]">
          <span className="text-[var(--color-text-lo)]">{icon}</span>
          {title}
        </span>
        {kbd && (
          <kbd className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-overlay)] px-1.5 py-0.5 text-[10px] tabular text-[var(--color-text-lo)]">
            {kbd}
          </kbd>
        )}
      </div>
      <p className="text-[11px] leading-snug text-[var(--color-text-lo)]">{children}</p>
    </Tag>
  );
}
