"use client";

import { useEffect, useState } from "react";

/**
 * Subscribes to a media query. SSR-safe — returns false during initial render
 * to keep server and client markup identical, then resolves on mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = (): void => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 639px)");
}

/** 640 - 1023px — tablet / small laptop range. */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
}

/**
 * Effective grid column count for the current viewport. The store still keeps
 * widget sizes/positions in 12-col coordinates; this is what we render with.
 *
 * Returns 1 (mobile stack), 6 (tablet), or 12 (desktop+).
 */
export function useResponsiveCols(desktopCols: number = 12): number {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  if (isMobile) return 1;
  if (isTablet) return 6;
  return desktopCols;
}
