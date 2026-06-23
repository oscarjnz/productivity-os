"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { loadAllWidgets } from "./registry";
import { useLayoutStore } from "@/stores/layout.store";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";
import type { WidgetDefinition } from "@/types/widget.types";

interface WidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetPicker({ open, onOpenChange }: WidgetPickerProps) {
  const [catalog, setCatalog] = useState<WidgetDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const addWidget = useLayoutStore((s) => s.addWidget);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    loadAllWidgets()
      .then((list) => {
        if (!cancelled) {
          setCatalog(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleAdd = (def: WidgetDefinition): void => {
    addWidget(def.type, {
      size: def.defaultSize,
      defaultConfig: def.defaultConfig as Record<string, unknown>,
    });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.fast, ease: easing.standard }}
                className={cn(
                  "fixed inset-0 z-[var(--z-overlay)]",
                  "bg-black/60 backdrop-blur-md",
                )}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: duration.base, ease: easing.standard }}
                className={cn(
                  "fixed left-1/2 top-1/2 z-[var(--z-modal)] -translate-x-1/2 -translate-y-1/2",
                  "w-[min(560px,92vw)] max-h-[80vh] overflow-hidden",
                  "rounded-[var(--radius-xl)] glass-panel",
                )}
              >
                <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-3.5">
                  <div className="flex flex-col gap-0.5">
                    <Dialog.Title className="text-[13px] font-semibold text-[var(--color-text-hi)]">
                      Add widget
                    </Dialog.Title>
                    <Dialog.Description className="text-[11.5px] text-[var(--color-text-lo)]">
                      Pick a widget to drop into your dashboard.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close
                    aria-label="Close"
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
                      "text-[var(--color-text-lo)]",
                      "transition-[background-color,color] duration-[var(--duration-fast)]",
                      "[transition-timing-function:var(--ease-standard)]",
                      "hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-hi)]",
                    )}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </Dialog.Close>
                </div>

                <div className="grid grid-cols-1 gap-1.5 overflow-y-auto p-2 sm:grid-cols-2">
                  {loading && catalog.length === 0 && (
                    <div className="col-span-full grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 p-3">
                          <Skeleton className="h-9 w-9 rounded-[var(--radius-sm)]" />
                          <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-2.5 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!loading && catalog.length === 0 && (
                    <div className="col-span-full flex flex-col items-center gap-1 px-3 py-6 text-center">
                      <span className="text-[12px] text-[var(--color-text-mid)]">
                        Couldn&apos;t load widgets
                      </span>
                      <span className="text-[10.5px] text-[var(--color-text-lo)]">
                        Check the browser console for details
                      </span>
                    </div>
                  )}
                  {catalog.map((def) => {
                    const Icon = def.icon;
                    return (
                      <button
                        key={def.type}
                        type="button"
                        onClick={() => handleAdd(def)}
                        className={cn(
                          "group flex items-start gap-3 p-3 text-left",
                          "rounded-[var(--radius-md)] border border-transparent",
                          "bg-transparent hover:bg-[var(--color-bg-raised)]",
                          "hover:border-[var(--color-border)]",
                          "transition-[background-color,border-color,transform] duration-[var(--duration-fast)]",
                          "[transition-timing-function:var(--ease-standard)]",
                          "active:scale-[0.99]",
                          "focus-visible:outline-none focus-visible:bg-[var(--color-bg-raised)]",
                          "focus-visible:border-[var(--color-accent-border)]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center",
                            "rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
                            "border border-[var(--color-accent-border)]",
                            "shadow-[inset_0_1px_0_oklch(1_0_0_/_0.05)]",
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-[13px] font-medium text-[var(--color-text-hi)]">
                            {def.name}
                          </span>
                          <span className="line-clamp-2 text-[11.5px] leading-snug text-[var(--color-text-lo)]">
                            {def.description}
                          </span>
                        </span>
                        <Plus
                          className={cn(
                            "ml-auto mt-0.5 h-3.5 w-3.5 shrink-0",
                            "text-[var(--color-text-lo)] opacity-0",
                            "transition-opacity duration-[var(--duration-fast)]",
                            "group-hover:opacity-100 group-focus-visible:opacity-100",
                          )}
                          aria-hidden
                        />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
