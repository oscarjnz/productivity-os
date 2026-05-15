"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { Plus, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBookmarks, useBookmarkMutations, faviconUrl } from "./use-bookmarks";
import { ManageBookmarks } from "./manage-bookmarks";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";
import type { WidgetProps } from "@/types/widget.types";
import type { BookmarksConfig } from "./config";
import type { DbBookmark } from "@/lib/db/dexie";

const UNGROUPED_KEY = "__ungrouped__";

function BookmarksWidgetInner({ config }: WidgetProps<BookmarksConfig>) {
  const bookmarks = useBookmarks();
  const { reorder } = useBookmarkMutations();
  const [manageOpen, setManageOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const groups = useMemo(() => {
    const map = new Map<string, DbBookmark[]>();
    for (const b of bookmarks) {
      const key = b.group_name ?? UNGROUPED_KEY;
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    // Sort: ungrouped first, then alphabetical
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === UNGROUPED_KEY) return -1;
      if (b === UNGROUPED_KEY) return 1;
      return a.localeCompare(b);
    });
  }, [bookmarks]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = bookmarks.findIndex((b) => b.id === active.id);
      const newIdx = bookmarks.findIndex((b) => b.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = arrayMove(bookmarks, oldIdx, newIdx);
      void reorder(reordered.map((b) => b.id));
    },
    [bookmarks, reorder],
  );

  const cols = Math.max(2, Math.min(8, config.columns));

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          {bookmarks.length} {bookmarks.length === 1 ? "link" : "links"}
        </span>
        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className={cn(
            "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1",
            "text-[11px] text-[var(--color-text-lo)]",
            "hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-mid)]",
          )}
        >
          <Settings2 className="h-3 w-3" aria-hidden />
          Manage
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={bookmarks.map((b) => b.id)} strategy={rectSortingStrategy}>
          <div className="-mr-1 flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {groups.map(([groupKey, items]) => (
                <section key={groupKey} className="flex flex-col gap-1.5">
                  {groupKey !== UNGROUPED_KEY && (
                    <h3 className="text-[9.5px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
                      {groupKey}
                    </h3>
                  )}
                  <div
                    className="grid auto-rows-min gap-2"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                  >
                    {items.map((b) => (
                      <SortableBookmark key={b.id} bookmark={b} />
                    ))}
                  </div>
                </section>
              ))}

              <button
                type="button"
                onClick={() => setManageOpen(true)}
                aria-label="Add bookmark"
                className={cn(
                  "ml-auto mt-2 flex h-8 w-8 items-center justify-center",
                  "rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-strong)]",
                  "text-[var(--color-text-lo)]",
                  "transition-[border-color,background-color,color] duration-[var(--duration-fast)]",
                  "hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]",
                )}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </button>
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      <ManageBookmarks open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  );
}

function SortableBookmark({ bookmark: b }: { bookmark: DbBookmark }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: b.id,
  });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: duration.fast, ease: easing.standard }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : "auto",
      }}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative aspect-square",
        isDragging && "z-20",
      )}
    >
      <a
        href={b.url}
        target="_blank"
        rel="noopener noreferrer"
        title={b.label}
        draggable={false}
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
        className={cn(
          "flex h-full flex-col items-center justify-center gap-1.5 p-1.5",
          "rounded-[var(--radius-sm)] border border-[var(--color-border)]",
          "bg-[var(--color-bg-base)] no-underline",
          "transition-[background-color,border-color,transform] duration-[var(--duration-fast)]",
          "[transition-timing-function:var(--ease-standard)]",
          "hover:bg-[var(--color-bg-raised)] hover:border-[var(--color-border-strong)]",
          "hover:-translate-y-[1px] active:scale-[0.96]",
          isDragging && "border-[var(--color-accent)] shadow-[var(--shadow-md)]",
        )}
      >
        {b.icon ? (
          <span className="text-[20px] leading-none">{b.icon}</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faviconUrl(b.url)}
            alt=""
            draggable={false}
            className="h-5 w-5 rounded-[4px]"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        )}
        <span className="w-full truncate text-center text-[10.5px] text-[var(--color-text-mid)] group-hover:text-[var(--color-text-hi)]">
          {b.label}
        </span>
      </a>
    </motion.div>
  );
}

export const BookmarksWidget = memo(BookmarksWidgetInner);
