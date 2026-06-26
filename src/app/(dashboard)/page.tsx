"use client";

import { WidgetGrid } from "@/features/layout-engine/widget-grid";
import { useLayoutStore } from "@/stores/layout.store";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { duration, easing } from "@/config/motion";
import { cn } from "@/lib/utils/cn";

// Lazy: the picker modal isn't part of the empty-state's first paint, only of
// the "Add widget" click. Keeps its chunk out of First Load JS. (2026-06-26)
const WidgetPicker = dynamic(
  () => import("@/features/widgets/core/widget-picker").then((m) => m.WidgetPicker),
  { ssr: false },
);

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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.slow, ease: easing.standard }}
          className="flex min-h-[62vh] flex-col items-center justify-center gap-5 text-center"
        >
          {/* Layered icon plate: accent wash + glass tile + soft float. */}
          <div className="relative">
            <div
              className="absolute -inset-4 rounded-full bg-[var(--color-accent-soft)] blur-2xl"
              aria-hidden
            />
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, ease: easing.standard, repeat: Infinity }}
              className={cn(
                "relative flex h-14 w-14 items-center justify-center",
                "rounded-[var(--radius-lg)] glass-hi text-[var(--color-accent)]",
                "shadow-[var(--shadow-md)]",
              )}
            >
              <LayoutGrid className="h-6 w-6" aria-hidden />
            </motion.div>
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[17px] font-semibold tracking-tight text-[var(--color-text-hi)]">
              Build your dashboard
            </h2>
            <p className="max-w-[340px] text-[12.5px] leading-relaxed text-[var(--color-text-lo)]">
              Drop in your first widget to track what matters. Press{" "}
              <kbd className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-1.5 py-0.5 text-[10px] tabular">
                ⌘K
              </kbd>{" "}
              anytime for the command palette.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => setPickerOpen(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add widget
          </Button>
        </motion.div>
        <WidgetPicker open={pickerOpen} onOpenChange={setPickerOpen} />
      </>
    );
  }

  return <WidgetGrid />;
}
