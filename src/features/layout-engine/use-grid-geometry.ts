"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { GridConfig, GridGeometry } from "./types";

/**
 * Observes a container's width and returns live cell geometry.
 * Cell width = (containerWidth - (cols - 1) * gap) / cols.
 */
export function useGridGeometry(
  config: GridConfig,
): { ref: RefObject<HTMLDivElement | null>; geometry: GridGeometry } {
  const ref = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(w);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const cellWidth =
    containerWidth > 0
      ? (containerWidth - (config.cols - 1) * config.gap) / config.cols
      : 0;

  return {
    ref,
    geometry: { ...config, containerWidth, cellWidth },
  };
}
