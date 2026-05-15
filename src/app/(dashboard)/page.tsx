"use client";

import { WidgetGrid } from "@/features/layout-engine/widget-grid";
import { useLayoutStore } from "@/stores/layout.store";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { WidgetPicker } from "@/features/widgets/core/widget-picker";

/**
 * Phase 2 dashboard surface.
 * Renders the grid of placed widgets driven by the layout store.
 * Empty-state CTA prompts the user to add their first widget.
 */
export default function DashboardPage() {
  const count = useLayoutStore((s) => s.order.length);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (count === 0) {
    return (
      <>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <LayoutGrid className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-[15px] font-semibold text-[var(--color-text-hi)]">
              Your dashboard is empty
            </h2>
            <p className="max-w-[320px] text-[12.5px] text-[var(--color-text-lo)]">
              Add a widget to get started. Press <kbd className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-1.5 py-0.5 text-[10px] tabular">⌘K</kbd> any time to open the command palette.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => setPickerOpen(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add widget
          </Button>
        </div>
        <WidgetPicker open={pickerOpen} onOpenChange={setPickerOpen} />
      </>
    );
  }

  return <WidgetGrid />;
}
