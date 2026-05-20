"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useLayoutStore } from "@/stores/layout.store";
import { useUIStore } from "@/stores/ui.store";
import { useGridGeometry } from "./use-grid-geometry";
import {
  applyGravity,
  clampPosition,
  deltaToCells,
  instanceToRect,
} from "./grid-utils";
import { WidgetHost } from "@/features/widgets/core/widget-host";
import { useIsMobile, useResponsiveCols } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils/cn";

interface DragPreview {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function WidgetGrid() {
  const order = useLayoutStore((s) => s.order);
  const instances = useLayoutStore((s) => s.instances);
  const grid = useLayoutStore((s) => s.grid);
  const bulkMove = useLayoutStore((s) => s.bulkMove);
  const isEditing = useUIStore((s) => s.isEditingLayout);

  const isMobile = useIsMobile();
  const effectiveCols = useResponsiveCols(grid.cols);

  // Geometry computed against the EFFECTIVE column count, so cellWidth lines
  // up with what the user sees on tablet/mobile, not the 12-col blueprint.
  const responsiveGrid = useMemo(
    () => ({ ...grid, cols: effectiveCols }),
    [grid, effectiveCols],
  );
  const { ref, geometry } = useGridGeometry(responsiveGrid);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  // Drag drop preview — tracks where the widget WILL land while dragging.
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);

  // Drag is disabled on small viewports — the layout collapses to a single
  // column there, so reordering by drag doesn't map onto anything visible.
  const dragDisabled = isMobile || effectiveCols < grid.cols;

  // For drag math we keep using the canonical 12-col model (what the data is
  // saved in), but cellWidth comes from the responsive geometry.
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      const inst = instances[id];
      if (!inst) return;
      setDragPreview({
        id,
        x: inst.position.x,
        y: inst.position.y,
        w: inst.size.w,
        h: inst.size.h,
      });
    },
    [instances],
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const id = String(event.active.id);
      const inst = instances[id];
      if (!inst) return;

      const { dx, dy } = deltaToCells(
        { x: event.delta.x, y: event.delta.y },
        geometry.cellWidth,
        geometry.rowHeight,
        geometry.gap,
      );

      const targetPos = clampPosition(
        { x: inst.position.x + dx, y: inst.position.y + dy },
        inst.size,
        grid.cols,
      );

      setDragPreview((prev) => {
        if (
          prev &&
          prev.id === id &&
          prev.x === targetPos.x &&
          prev.y === targetPos.y
        ) {
          return prev;
        }
        return { id, x: targetPos.x, y: targetPos.y, w: inst.size.w, h: inst.size.h };
      });
    },
    [instances, geometry, grid.cols],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragPreview(null);

      const id = String(event.active.id);
      const inst = instances[id];
      if (!inst) return;

      const { dx, dy } = deltaToCells(
        { x: event.delta.x, y: event.delta.y },
        geometry.cellWidth,
        geometry.rowHeight,
        geometry.gap,
      );
      if (dx === 0 && dy === 0) return;

      const targetPos = clampPosition(
        { x: inst.position.x + dx, y: inst.position.y + dy },
        inst.size,
        grid.cols,
      );

      // Build the post-move rect list (moved widget at its new target).
      const movedRect = {
        id,
        x: targetPos.x,
        y: targetPos.y,
        w: inst.size.w,
        h: inst.size.h,
      };
      const otherRects = order
        .filter((oid) => oid !== id)
        .map((oid) => instanceToRect(instances[oid]!));
      const settled = applyGravity([movedRect, ...otherRects], id);

      // Diff vs current positions and apply only what changed.
      const updates = settled
        .map((rect) => ({
          id: rect.id,
          position: { x: rect.x, y: rect.y },
        }))
        .filter((u) => {
          const before = instances[u.id];
          return (
            !!before &&
            (before.position.x !== u.position.x || before.position.y !== u.position.y)
          );
        });

      if (updates.length > 0) bulkMove(updates);
    },
    [instances, order, geometry, grid.cols, bulkMove],
  );

  const handleDragCancel = useCallback(() => {
    setDragPreview(null);
  }, []);

  // Determine the visual column span for a widget at its canonical (saved)
  // size, given the current effective column count. The data on disk stays
  // in 12-col coordinates — this is purely a render-time projection.
  const projectToEffective = useCallback(
    (widgetX: number, widgetW: number): { col: number; span: number } => {
      if (effectiveCols >= grid.cols) return { col: widgetX, span: widgetW };
      // Proportionally scale x and w from 12-col -> effective-col space.
      const ratio = effectiveCols / grid.cols;
      const span = Math.max(1, Math.min(effectiveCols, Math.round(widgetW * ratio)));
      const col = Math.max(0, Math.min(effectiveCols - span, Math.round(widgetX * ratio)));
      return { col, span };
    },
    [effectiveCols, grid.cols],
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        ref={ref}
        className={cn("relative w-full")}
        style={{
          display: "grid",
          gridTemplateColumns:
            effectiveCols === 1 ? "1fr" : `repeat(${effectiveCols}, minmax(0, 1fr))`,
          gridAutoRows: effectiveCols === 1 ? "min-content" : `${grid.rowHeight}px`,
          gap: `${grid.gap}px`,
        }}
      >
        {/* Drag landing zone — rendered FIRST so widgets paint over it on
            their starting cell, and shows on top via z-index where the user
            is moving. */}
        {dragPreview && effectiveCols === grid.cols && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none rounded-[var(--radius-lg)]",
              "border-2 border-dashed border-[var(--color-accent)]",
              "bg-[var(--color-accent-soft)]",
              "transition-[grid-column,grid-row] duration-[120ms] ease-out",
            )}
            style={{
              gridColumn: `${dragPreview.x + 1} / span ${dragPreview.w}`,
              gridRow: `${dragPreview.y + 1} / span ${dragPreview.h}`,
              zIndex: 1,
            }}
          />
        )}

        {order.map((id, idx) => {
          const inst = instances[id];
          if (!inst) return null;

          // Mobile: stack vertically, ignore stored positions.
          // Tablet/desktop: project canonical 12-col coords to effective cols.
          let col = inst.position.x;
          let span = inst.size.w;
          if (effectiveCols === 1) {
            col = 0;
            span = 1;
          } else if (effectiveCols !== grid.cols) {
            const proj = projectToEffective(inst.position.x, inst.size.w);
            col = proj.col;
            span = proj.span;
          }

          return (
            <WidgetHost
              key={id}
              instance={inst}
              geometry={geometry}
              isEditing={isEditing}
              isMobile={effectiveCols === 1}
              delay={Math.min(idx * 0.03, 0.18)}
              // Render-time overrides — the underlying instance isn't mutated.
              renderCol={col}
              renderSpan={span}
              effectiveCols={effectiveCols}
              // Drag/resize only make sense in the canonical 12-col layout;
              // on tablet/mobile the positions are render-time projections.
              dragEnabled={!dragDisabled}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
