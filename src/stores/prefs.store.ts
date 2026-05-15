"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Density = "compact" | "comfortable" | "spacious";
export type AccentHue = "indigo" | "violet" | "blue" | "teal" | "rose" | "amber";

interface PrefsState {
  density: Density;
  accent: AccentHue;
  reducedMotion: boolean;
  /** User-supplied locale override; falls back to browser. */
  locale: string | null;
  /** IANA timezone override; falls back to browser. Empty/null = browser. */
  timezone: string | null;
  /** First-run banner dismissed. */
  hasSeenOnboarding: boolean;

  setDensity: (d: Density) => void;
  setAccent: (a: AccentHue) => void;
  setReducedMotion: (r: boolean) => void;
  setLocale: (l: string | null) => void;
  setTimezone: (tz: string | null) => void;
  setHasSeenOnboarding: (v: boolean) => void;
}

export const useprefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      density: "comfortable",
      accent: "indigo",
      reducedMotion: false,
      locale: null,
      timezone: null,
      hasSeenOnboarding: false,

      setDensity: (density) => set({ density }),
      setAccent: (accent) => set({ accent }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setLocale: (locale) => set({ locale }),
      setTimezone: (timezone) => set({ timezone }),
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
    }),
    {
      name: "pos.prefs",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

// Convention-matched alias
export const usePrefsStore = useprefsStore;
