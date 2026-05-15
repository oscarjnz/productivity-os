"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { loadAllWidgets } from "./registry";
import { useLayoutStore } from "@/stores/layout.store";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";
import type { WidgetDefinition } from "@/types/widget.types";

interface WidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetPicker({ open, onOpenChange }: WidgetPickerProps) {
  const [catalog, setCatalog] = useState<WidgetDefinition[]>([]);
  const addWidget = useLayoutStore((s) => s.addWidget);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadAllWidgets().then((list) => {
      if (!cancelled) setCatalog(list);
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
                  "rounded-[var(--radius-xl)] glass-hi shadow-[var(--shadow-lg)]",
                )}
              >
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
                  <Dialog.Title className="text-[13px] font-semibold text-[var(--color-text-hi)]">
                    Add widget
                  </Dialog.Title>
                  <Dialog.Close
                    aria-label="Close"
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]",
                      "text-[var(--color-text-lo)] hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-mid)]",
                    )}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </Dialog.Close>
                </div>

                <div className="grid grid-cols-2 gap-2 overflow-y-auto p-3">
                  {catalog.map((def) => {
                    const Icon = def.icon;
                    return (
                      <button
                        key={def.type}
                        type="button"
                        onClick={() => handleAdd(def)}
                        className={cn(
                          "group flex items-start gap-3 p-3 text-left",
                          "rounded-[var(--radius-md)] border border-[var(--color-border)]",
                          "bg-[var(--color-bg-raised)] hover:bg-[var(--color-bg-overlay)]",
                          "hover:border-[var(--color-border-strong)]",
                          "transition-[background-color,border-color,transform] duration-[var(--duration-fast)]",
                          "[transition-timing-function:var(--ease-standard)]",
                          "active:scale-[0.99]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center",
                            "rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-medium text-[var(--color-text-hi)]">
                            {def.name}
                          </span>
                          <span className="text-[11.5px] leading-snug text-[var(--color-text-lo)]">
                            {def.description}
                          </span>
                        </span>
                        <Plus
                          className="ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-text-lo)] opacity-0 group-hover:opacity-100"
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
