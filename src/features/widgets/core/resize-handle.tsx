"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WidgetSize } from "@/types/widget.types";
import type { GridGeometry } from "@/features/layout-engine/types";
import { cn } from "@/lib/utils/cn";

interface ResizeHandleProps {
  size: WidgetSize;
  minSize: WidgetSize;
  maxSize?: WidgetSize | undefined;
  geometry: GridGeometry;
  /** Live preview while dragging (does NOT commit to store). */
  onPreview: (next: WidgetSize | null) => void;
  /** Commit final size on pointer up. */
  onCommit: (next: WidgetSize) => void;
}

/**
 * Bottom-right corner resize handle. Snaps to grid cells.
 * Shows visible affordance only on hover (or while editing).
 */
export function ResizeHandle({
  size,
  minSize,
  maxSize,
  geometry,
  onPreview,
  onCommit,
}: ResizeHandleProps) {
  const [active, setActive] = useState(false);
  const startRef = useRef<{ px: number; py: number; w: number; h: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startRef.current = { px: e.clientX, py: e.clientY, w: size.w, h: size.h };
      setActive(true);
    },
    [size.w, size.h],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = startRef.current;
      if (!start) return;
      const dxPx = e.clientX - start.px;
      const dyPx = e.clientY - start.py;
      const cellStrideX = geometry.cellWidth + geometry.gap;
      const cellStrideY = geometry.rowHeight + geometry.gap;
      const dw = cellStrideX > 0 ? Math.round(dxPx / cellStrideX) : 0;
      const dh = cellStrideY > 0 ? Math.round(dyPx / cellStrideY) : 0;

      const nextW = Math.max(
        minSize.w,
        Math.min(maxSize?.w ?? geometry.cols, start.w + dw),
      );
      const nextH = Math.max(minSize.h, Math.min(maxSize?.h ?? 50, start.h + dh));
      onPreview({ w: nextW, h: nextH });
    },
    [geometry.cellWidth, geometry.gap, geometry.rowHeight, geometry.cols, minSize, maxSize, onPreview],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = startRef.current;
      if (!start) return;
      const dxPx = e.clientX - start.px;
      const dyPx = e.clientY - start.py;
      const cellStrideX = geometry.cellWidth + geometry.gap;
      const cellStrideY = geometry.rowHeight + geometry.gap;
      const dw = cellStrideX > 0 ? Math.round(dxPx / cellStrideX) : 0;
      const dh = cellStrideY > 0 ? Math.round(dyPx / cellStrideY) : 0;

      const nextW = Math.max(
        minSize.w,
        Math.min(maxSize?.w ?? geometry.cols, start.w + dw),
      );
      const nextH = Math.max(minSize.h, Math.min(maxSize?.h ?? 50, start.h + dh));

      startRef.current = null;
      setActive(false);
      onPreview(null);
      if (nextW !== start.w || nextH !== start.h) {
        onCommit({ w: nextW, h: nextH });
      }
    },
    [geometry, minSize, maxSize, onPreview, onCommit],
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize widget"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        "absolute bottom-1 right-1 z-10",
        "h-4 w-4 cursor-se-resize",
        "rounded-[var(--radius-xs)]",
        "transition-opacity duration-[var(--duration-fast)]",
        "[transition-timing-function:var(--ease-standard)]",
        active
          ? "opacity-100"
          : "opacity-0 group-hover/widget:opacity-60 hover:!opacity-100",
      )}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-full w-full"
        fill="none"
        aria-hidden
      >
        <path
          d="M14 6 L6 14 M14 10 L10 14 M14 14 L14 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-[var(--color-text-lo)]"
        />
      </svg>
    </div>
  );
}
