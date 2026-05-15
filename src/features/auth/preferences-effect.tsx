"use client";

import { useEffect } from "react";
import { usePrefsStore } from "@/stores/prefs.store";

/**
 * Reflects user preferences onto <html> as data attributes.
 * CSS in globals.css reads these and overrides tokens.
 * Mount once at the app root.
 */
export function PreferencesEffect() {
  const density = usePrefsStore((s) => s.density);
  const accent = usePrefsStore((s) => s.accent);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset["density"] = density;
    root.dataset["accent"] = accent;
    if (reducedMotion) root.dataset["reducedMotion"] = "true";
    else delete root.dataset["reducedMotion"];
  }, [density, accent, reducedMotion]);

  return null;
}
