"use client";

import { useEffect, useState, type ReactNode } from "react";
import { loadWidget } from "./registry";
import { WidgetErrorBoundary } from "./widget-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetDefinition, WidgetInstance } from "@/types/widget.types";

interface WidgetRendererProps {
  instance: WidgetInstance;
  isEditing: boolean;
  onConfigChange: (id: string, config: Record<string, unknown>) => void;
  /** Pre-resolved definition from the host. When provided, the renderer skips
   *  its own async load — the host already loaded it for the header, so this
   *  avoids a second registry round-trip and an extra entrance flicker. */
  def?: WidgetDefinition | null;
  /** Host-resolved "type not found in registry" flag (pairs with `def`). */
  missing?: boolean;
}

function WidgetSkeleton(): ReactNode {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-2 p-2">
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="h-2.5 w-32" />
      <Skeleton className="h-2.5 w-20" />
    </div>
  );
}

function WidgetMissing({ type }: { type: string }): ReactNode {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
      <div className="text-[12px] font-medium text-[var(--color-text-mid)]">
        Unknown widget
      </div>
      <code className="text-[11px] text-[var(--color-text-lo)]">{type}</code>
    </div>
  );
}

/**
 * Lazily loads a widget definition from the registry and renders its component.
 * Wraps the component in an error boundary so one crash can't take down the dashboard.
 */
export function WidgetRenderer({
  instance,
  isEditing,
  onConfigChange,
  def: defProp,
  missing: missingProp,
}: WidgetRendererProps): ReactNode {
  // Only self-load when the host didn't already resolve the definition. This
  // keeps the component reusable in isolation while avoiding a duplicate load
  // in the normal host-driven path.
  const hostResolved = defProp !== undefined || missingProp !== undefined;
  const [selfDef, setSelfDef] = useState<WidgetDefinition | null>(null);
  const [selfMissing, setSelfMissing] = useState(false);

  useEffect(() => {
    if (hostResolved) return;
    let cancelled = false;
    setSelfMissing(false);
    setSelfDef(null);
    loadWidget(instance.type).then((d) => {
      if (cancelled) return;
      if (d) setSelfDef(d);
      else setSelfMissing(true);
    });
    return () => {
      cancelled = true;
    };
  }, [instance.type, hostResolved]);

  const def = hostResolved ? defProp ?? null : selfDef;
  const missing = hostResolved ? !!missingProp : selfMissing;

  if (missing) return <WidgetMissing type={instance.type} />;
  if (!def) return <WidgetSkeleton />;

  const Component = def.component;

  return (
    <WidgetErrorBoundary widgetType={instance.type}>
      <Component
        instanceId={instance.id}
        config={instance.config}
        size={instance.size}
        isEditing={isEditing}
        onConfigChange={(next) => onConfigChange(instance.id, next as Record<string, unknown>)}
      />
    </WidgetErrorBoundary>
  );
}
