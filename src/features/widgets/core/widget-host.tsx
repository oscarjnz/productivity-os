"use client";

import { memo, useEffect, useState, type ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { fadeUp } from "@/config/motion";
import { loadWidget } from "./registry";
import { WidgetRenderer } from "./widget-renderer";
import { ResizeHandle } from "./resize-handle";
import { WidgetSettingsPopover } from "./widget-settings";
import { useLayoutStore } from "@/stores/layout.store";
import type { WidgetDefinition, WidgetInstance, WidgetSize } from "@/types/widget.types";
import type { GridGeometry } from "@/features/layout-engine/types";

interface WidgetHostProps {
  instance: WidgetInstance;
  geometry: GridGeometry;
  isEditing: boolean;
  isMobile?: boolean;
  delay?: number;
}

function WidgetHostInner({
  instance,
  geometry,
  isEditing,
  isMobile = false,
  delay = 0,
}: WidgetHostProps) {
  const [def, setDef] = useState<WidgetDefinition | null>(null);
  const [previewSize, setPreviewSize] = useState<WidgetSize | null>(null);
  const removeWidget = useLayoutStore((s) => s.removeWidget);
  const resizeWidget = useLayoutStore((s) => s.resizeWidget);
  const updateConfig = useLayoutStore((s) => s.updateConfig);

  useEffect(() => {
    let cancelled = false;
    loadWidget(instance.type).then((d) => {
      if (!cancelled && d) setDef(d);
    });
    return () => {
      cancelled = true;
    };
  }, [instance.type]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: instance.id,
    disabled: !isEditing,
  });

  const displaySize = previewSize ?? instance.size;
  const Icon = def?.icon;

  return (
    <motion.div
      ref={setNodeRef}
      layout={isDragging || isMobile ? false : "position"}
      layoutDependency={`${instance.position.x},${instance.position.y}`}
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      exit={fadeUp.exit}
      transition={{ ...fadeUp.transition, delay, layout: { duration: 0.32, ease: [0.2, 0, 0, 1] } }}
      style={{
        gridColumn: isMobile ? "1 / -1" : `${instance.position.x + 1} / span ${displaySize.w}`,
        gridRow: isMobile ? "auto" : `${instance.position.y + 1} / span ${displaySize.h}`,
        minHeight: isMobile ? `${displaySize.h * geometry.rowHeight}px` : undefined,
        transform: isMobile ? undefined : CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : "auto",
      }}
      className={cn(
        "group/widget relative",
        isDragging && "cursor-grabbing",
      )}
      data-widget-id={instance.id}
    >
      <div
        className={cn(
          "relative h-full w-full overflow-hidden",
          "rounded-[var(--radius-lg)] glass shadow-[var(--shadow-md)]",
          "transition-[border-color,box-shadow,transform] duration-[var(--duration-fast)]",
          "[transition-timing-function:var(--ease-standard)]",
          "hover:border-[var(--color-border-strong)]",
          isDragging && "scale-[1.02] shadow-[var(--shadow-lg)] border-[var(--color-accent)]",
          isEditing && "ring-1 ring-[var(--color-border-strong)] ring-offset-0",
        )}
      >
        <header
          className={cn(
            "flex items-center justify-between gap-3",
            "px-[var(--density-pad-x)] pt-[var(--density-pad-header-y)] pb-1.5",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em]",
              "text-[var(--color-text-lo)]",
            )}
          >
            {Icon && <Icon className="h-3 w-3" aria-hidden />}
            <span>{def?.name ?? instance.type}</span>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-[var(--duration-fast)] group-hover/widget:opacity-100">
            {isEditing && (
              <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
                className={cn(
                  "flex h-6 w-6 cursor-grab items-center justify-center",
                  "rounded-[var(--radius-xs)] text-[var(--color-text-lo)]",
                  "hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-mid)]",
                  "active:cursor-grabbing",
                )}
              >
                <GripVertical className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
            <WidgetSettingsPopover hasSettings={!!def?.settings}>
              {def?.settings && (
                <def.settings
                  config={instance.config as never}
                  onChange={(next) => updateConfig(instance.id, next as Record<string, unknown>)}
                />
              )}
            </WidgetSettingsPopover>
            {isEditing && (
              <button
                type="button"
                aria-label="Remove widget"
                onClick={() => removeWidget(instance.id)}
                className={cn(
                  "flex h-6 w-6 items-center justify-center",
                  "rounded-[var(--radius-xs)] text-[var(--color-text-lo)]",
                  "hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]",
                )}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
        </header>

        <div className="h-[calc(100%-2.25rem)] px-[var(--density-pad-x)] pb-[var(--density-pad-y)] pt-1">
          <WidgetRenderer
            instance={instance}
            isEditing={isEditing}
            onConfigChange={updateConfig}
          />
        </div>

        {isEditing && def && (
          <ResizeHandle
            size={instance.size}
            minSize={def.minSize}
            maxSize={def.maxSize}
            geometry={geometry}
            onPreview={setPreviewSize}
            onCommit={(next) => resizeWidget(instance.id, next, def.minSize, def.maxSize)}
          />
        )}
      </div>
    </motion.div>
  );
}

export const WidgetHost = memo(WidgetHostInner);
