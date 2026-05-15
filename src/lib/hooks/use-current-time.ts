"use client";

import { useEffect, useState } from "react";

/**
 * Single source of "now" — drives clock, greetings, timestamps.
 *
 * Returns `null` on the server and during the first client render so SSR
 * markup matches hydration. After mount, it returns a fresh Date and ticks
 * every `intervalMs`. Pauses while document is hidden.
 *
 * Consumers should render a skeleton/dashes when the value is null.
 */
export function useCurrentTime(intervalMs: number = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;

    const tick = (): void => setNow(new Date());

    const start = (): void => {
      if (id !== undefined) return;
      tick();
      id = setInterval(tick, intervalMs);
    };

    const stop = (): void => {
      if (id !== undefined) {
        clearInterval(id);
        id = undefined;
      }
    };

    const handleVisibility = (): void => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs]);

  return now;
}
