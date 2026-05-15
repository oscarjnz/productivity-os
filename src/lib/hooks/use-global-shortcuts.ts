"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui.store";

/**
 * Global keyboard shortcuts. Mounted once at the dashboard layout level.
 *
 * Scope rules:
 *   - Ignored when an input/textarea/contenteditable has focus,
 *     EXCEPT for explicit overrides (Cmd/Ctrl+K, Escape).
 */
export function useGlobalShortcuts(): void {
  useEffect(() => {
    function isTypingTarget(t: EventTarget | null): boolean {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return true;
      if (t.isContentEditable) return true;
      return false;
    }

    function onKey(e: KeyboardEvent): void {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+K — always toggles palette
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useUIStore.getState().togglePalette();
        return;
      }

      // Escape — closes palette regardless of focus
      if (e.key === "Escape") {
        const { paletteOpen, closePalette } = useUIStore.getState();
        if (paletteOpen) {
          e.preventDefault();
          closePalette();
        }
        return;
      }

      if (isTypingTarget(e.target)) return;

      // Future scope-free shortcuts go here (e.g. "e" → edit layout).
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
