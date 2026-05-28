"use client";

import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Pencil, RotateCcw, Trash2, Search } from "lucide-react";
import { loadAllWidgets } from "@/features/widgets/core/registry";
import { useLayoutStore } from "@/stores/layout.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";
import type { WidgetDefinition } from "@/types/widget.types";

export function CommandPalette() {
  const open = useUIStore((s) => s.paletteOpen);
  const closePalette = useUIStore((s) => s.closePalette);
  const setEditingLayout = useUIStore((s) => s.setEditingLayout);
  const isEditing = useUIStore((s) => s.isEditingLayout);

  const addWidget = useLayoutStore((s) => s.addWidget);
  const resetLayout = useLayoutStore((s) => s.resetLayout);
  const instances = useLayoutStore((s) => s.instances);
  const order = useLayoutStore((s) => s.order);
  const removeWidget = useLayoutStore((s) => s.removeWidget);

  const [catalog, setCatalog] = useState<WidgetDefinition[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    loadAllWidgets().then(setCatalog);
  }, [open]);

  // Reset search when closing
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const placedList = useMemo(
    () => order.map((id) => instances[id]).filter((x): x is NonNullable<typeof x> => !!x),
    [order, instances],
  );

  const handleAdd = (def: WidgetDefinition): void => {
    addWidget(def.type, {
      size: def.defaultSize,
      defaultConfig: def.defaultConfig as Record<string, unknown>,
    });
    closePalette();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (o ? null : closePalette())}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.fast, ease: easing.standard }}
                className="fixed inset-0 z-[var(--z-overlay)] bg-black/60 backdrop-blur-md"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: duration.base, ease: easing.standard }}
                className={cn(
                  "fixed left-1/2 top-[15vh] z-[var(--z-palette)] -translate-x-1/2",
                  "w-[min(620px,92vw)] overflow-hidden",
                  "rounded-[var(--radius-xl)] glass-hi shadow-[var(--shadow-lg)]",
                )}
              >
                <Dialog.Title className="sr-only">Command palette</Dialog.Title>
                <Command
                  className="flex flex-col"
                  loop
                  filter={(value, search) => {
                    if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                    return 0;
                  }}
                >
                  <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] px-4 py-3.5">
                    <Search
                      className="h-4 w-4 shrink-0 text-[var(--color-text-lo)]"
                      aria-hidden
                    />
                    <Command.Input
                      autoFocus
                      value={search}
                      onValueChange={setSearch}
                      placeholder="Type a command or search…"
                      className={cn(
                        "flex-1 bg-transparent text-[14px] text-[var(--color-text-hi)] outline-none",
                        "placeholder:text-[var(--color-text-lo)] caret-[var(--color-accent)]",
                      )}
                    />
                    <kbd
                      className={cn(
                        "rounded-[var(--radius-xs)] border border-[var(--color-border)]",
                        "bg-[var(--color-bg-base)] px-1.5 py-0.5",
                        "text-[10px] font-medium text-[var(--color-text-lo)] tabular",
                      )}
                    >
                      ESC
                    </kbd>
                  </div>

                  <Command.List
                    className={cn(
                      "max-h-[55vh] overflow-y-auto p-1.5",
                      "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5",
                      "[&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold",
                      "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em]",
                      "[&_[cmdk-group-heading]]:text-[var(--color-text-lo)]",
                    )}
                  >
                    <Command.Empty className="px-3 py-6 text-center text-[12.5px] text-[var(--color-text-lo)]">
                      No results.
                    </Command.Empty>

                    <Command.Group heading="Layout">
                      <PaletteItem
                        value="toggle edit layout mode"
                        icon={<Pencil className="h-3.5 w-3.5" aria-hidden />}
                        onSelect={() => {
                          setEditingLayout(!isEditing);
                          closePalette();
                        }}
                      >
                        {isEditing ? "Exit edit mode" : "Edit layout"}
                      </PaletteItem>
                      <PaletteItem
                        value="reset layout to defaults"
                        icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}
                        onSelect={() => {
                          resetLayout();
                          closePalette();
                        }}
                      >
                        Reset layout
                      </PaletteItem>
                    </Command.Group>

                    <Command.Group heading="Add widget">
                      {catalog.map((def) => {
                        const Icon = def.icon;
                        return (
                          <PaletteItem
                            key={def.type}
                            value={`add ${def.name} widget ${def.description}`}
                            icon={<Icon className="h-3.5 w-3.5" aria-hidden />}
                            onSelect={() => handleAdd(def)}
                          >
                            <span className="flex flex-col">
                              <span>{def.name}</span>
                              <span className="text-[11px] text-[var(--color-text-lo)]">
                                {def.description}
                              </span>
                            </span>
                            <Plus
                              className="ml-auto h-3.5 w-3.5 text-[var(--color-text-lo)]"
                              aria-hidden
                            />
                          </PaletteItem>
                        );
                      })}
                    </Command.Group>

                    {placedList.length > 0 && (
                      <Command.Group heading="Remove widget">
                        {placedList.map((inst) => (
                          <PaletteItem
                            key={inst.id}
                            value={`remove ${inst.type} ${inst.id}`}
                            icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                            onSelect={() => {
                              removeWidget(inst.id);
                              closePalette();
                            }}
                          >
                            <span className="capitalize">{inst.type}</span>
                            <span className="ml-auto text-[10.5px] text-[var(--color-text-lo)] tabular">
                              {inst.id.slice(0, 6)}
                            </span>
                          </PaletteItem>
                        ))}
                      </Command.Group>
                    )}
                  </Command.List>
                </Command>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

interface PaletteItemProps {
  value: string;
  icon: React.ReactNode;
  onSelect: () => void;
  children: React.ReactNode;
}

function PaletteItem({ value, icon, onSelect, children }: PaletteItemProps) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2",
        "text-[13px] text-[var(--color-text-mid)]",
        "transition-[background-color,color] duration-[var(--duration-instant)]",
        "[transition-timing-function:var(--ease-standard)]",
        "data-[selected=true]:bg-[var(--color-accent-soft)]",
        "data-[selected=true]:text-[var(--color-text-hi)]",
        "data-[selected=true]:shadow-[inset_0_0_0_1px_var(--color-accent-border)]",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center text-[var(--color-text-lo)]",
          "transition-colors duration-[var(--duration-instant)]",
          "group-data-[selected=true]:text-[var(--color-accent)]",
        )}
      >
        {icon}
      </span>
      {children}
    </Command.Item>
  );
}
