"use client";

import { useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils/cn";

export function WidgetGrid() {
  const order = useLayoutStore((s) => s.order);
  const instances = useLayoutStore((s) => s.instances);
  const grid = useLayoutStore((s) => s.grid);
  const bulkMove = useLayoutStore((s) => s.bulkMove);
  const isEditing = useUIStore((s) => s.isEditingLayout);

  const { ref, geometry } = useGridGeometry(grid);
  const isMobile = useIsMobile();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
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

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        ref={ref}
        className={cn("relative w-full")}
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : `repeat(${grid.cols}, minmax(0, 1fr))`,
          gridAutoRows: isMobile ? "min-content" : `${grid.rowHeight}px`,
          gap: `${grid.gap}px`,
        }}
      >
        {order.map((id, idx) => {
          const inst = instances[id];
          if (!inst) return null;
          return (
            <WidgetHost
              key={id}
              instance={inst}
              geometry={geometry}
              isEditing={isEditing && !isMobile}
              isMobile={isMobile}
              delay={Math.min(idx * 0.03, 0.18)}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
