import type { WidgetInstance, WidgetPosition, WidgetSize } from "@/types/widget.types";
import type { PlacedRect } from "./types";

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function rectsOverlap(a: PlacedRect, b: PlacedRect): boolean {
  if (a.id === b.id) return false;
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function instanceToRect(i: WidgetInstance): PlacedRect {
  return { id: i.id, x: i.position.x, y: i.position.y, w: i.size.w, h: i.size.h };
}

/**
 * True if `candidate` collides with any rect in `others`.
 * `others` should NOT include the candidate itself.
 */
export function hasCollision(candidate: PlacedRect, others: PlacedRect[]): boolean {
  for (const o of others) if (rectsOverlap(candidate, o)) return true;
  return false;
}

/**
 * Find the first y row where a widget of the given size can be placed
 * starting at x=0, scanning top-down.
 * Returns the position. Always succeeds (grid is infinitely tall).
 */
export function findFirstFreePosition(
  size: WidgetSize,
  cols: number,
  occupied: PlacedRect[],
): WidgetPosition {
  const w = Math.min(size.w, cols);

  // Scan row by row. Within a row, try each x from 0..cols-w.
  for (let y = 0; y < 200; y++) {
    for (let x = 0; x <= cols - w; x++) {
      const candidate: PlacedRect = { id: "__probe__", x, y, w, h: size.h };
      if (!hasCollision(candidate, occupied)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

/**
 * Snap a continuous (px) delta to grid cells.
 */
export function deltaToCells(
  deltaPx: { x: number; y: number },
  cellWidth: number,
  rowHeight: number,
  gap: number,
): { dx: number; dy: number } {
  return {
    dx: Math.round(deltaPx.x / (cellWidth + gap)),
    dy: Math.round(deltaPx.y / (rowHeight + gap)),
  };
}

export function clampPosition(
  pos: WidgetPosition,
  size: WidgetSize,
  cols: number,
): WidgetPosition {
  return {
    x: clamp(pos.x, 0, Math.max(0, cols - size.w)),
    y: Math.max(0, pos.y),
  };
}

/**
 * Notion-style gravity push.
 *
 * After moving `movedId` to its new target rect (already in `rects`), any
 * widget that collides with it is pushed straight down to clear. Cascades
 * if the pushed widget then collides with another.
 *
 * Pure function — returns a new array, never mutates input.
 */
export function applyGravity(rects: PlacedRect[], movedId: string): PlacedRect[] {
  const out = rects.map((r) => ({ ...r }));
  const settled = new Set<string>([movedId]);
  let iterations = 0;

  while (iterations < 200) {
    iterations++;
    let pushedThisRound = false;

    for (const r of out) {
      if (settled.has(r.id)) continue;
      for (const s of out) {
        if (!settled.has(s.id)) continue;
        if (rectsOverlap(r, s)) {
          r.y = s.y + s.h;
          settled.add(r.id);
          pushedThisRound = true;
          break;
        }
      }
    }

    if (!pushedThisRound) break;
  }

  return out;
}

export function clampSize(
  size: WidgetSize,
  pos: WidgetPosition,
  cols: number,
  min: WidgetSize,
  max?: WidgetSize,
): WidgetSize {
  const maxW = max?.w ?? cols;
  const maxH = max?.h ?? 100;
  return {
    w: clamp(size.w, min.w, Math.min(maxW, cols - pos.x)),
    h: clamp(size.h, min.h, maxH),
  };
}
