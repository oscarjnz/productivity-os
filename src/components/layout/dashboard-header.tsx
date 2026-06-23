"use client";

import { useMemo, useState } from "react";
import { Command, Pencil, Plus, Check } from "lucide-react";
import { useCurrentTime } from "@/lib/hooks/use-current-time";
import { formatLongDate } from "@/lib/utils/format";
import { useUIStore } from "@/stores/ui.store";
import { Button } from "@/components/ui/button";
import { WidgetPicker } from "@/features/widgets/core/widget-picker";
import { UserMenu } from "@/features/auth/user-menu";
import { cn } from "@/lib/utils/cn";

export function DashboardHeader() {
  const now = useCurrentTime(30_000);
  const date = useMemo(() => (now ? formatLongDate(now) : ""), [now]);

  const togglePalette = useUIStore((s) => s.togglePalette);
  const isEditing = useUIStore((s) => s.isEditingLayout);
  const setEditingLayout = useUIStore((s) => s.setEditingLayout);

  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between gap-3 px-1">
      {/* Brand mark — the accent dot breathes a slow halo so the chrome reads
          as "live" without any literal animation noise. */}
      <div className="flex items-center gap-2.5">
        <span
          className="relative inline-flex text-[var(--color-accent)]"
          aria-hidden
        >
          <span className="status-dot h-1.5 w-1.5" />
        </span>
        <span
          className={cn(
            "text-[11.5px] font-semibold uppercase tracking-[0.10em]",
            "text-[var(--color-text-mid)]",
          )}
        >
          Productivity OS
        </span>
        <span
          className={cn(
            "hidden h-3 w-px bg-[var(--color-border)] md:inline-block",
          )}
          aria-hidden
        />
        <span
          className={cn(
            "hidden text-[11.5px] text-[var(--color-text-lo)] tabular md:inline",
          )}
        >
          {date}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPickerOpen(true)}
          aria-label="Add widget"
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden text-[12px] sm:inline">Widget</span>
        </Button>

        <Button
          variant={isEditing ? "primary" : "ghost"}
          size="sm"
          onClick={() => setEditingLayout(!isEditing)}
          aria-label={isEditing ? "Done editing" : "Edit layout"}
          className="hidden gap-1.5 sm:inline-flex"
        >
          {isEditing ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          )}
          <span className="text-[12px]">{isEditing ? "Done" : "Edit"}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={togglePalette}
          aria-label="Open command palette"
          className="gap-2 px-2.5"
        >
          <Command className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden text-[12px] sm:inline">Search</span>
          <kbd
            className={cn(
              "ml-1 hidden items-center gap-0.5 rounded-[var(--radius-xs)] px-1.5 py-0.5",
              "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
              "text-[10px] font-medium text-[var(--color-text-lo)] tabular sm:inline-flex",
            )}
          >
            ⌘K
          </kbd>
        </Button>

        <div className="ml-1.5">
          <UserMenu />
        </div>
      </div>

      <WidgetPicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </header>
  );
}
