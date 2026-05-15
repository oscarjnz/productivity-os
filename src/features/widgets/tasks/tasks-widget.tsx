"use client";

import { memo, useState, useMemo, useCallback } from "react";
import { Plus, X, CheckCircle2, GripVertical } from "lucide-react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTasks, useTaskMutations } from "./use-tasks";
import { resolveFilter, type TaskFilter } from "./config";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";
import type { WidgetProps } from "@/types/widget.types";
import type { TasksConfig } from "./config";
import type { DbTask } from "@/lib/db/dexie";

const FILTERS: ReadonlyArray<{ value: TaskFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "done", label: "Done" },
];

function TasksWidgetInner({ config }: WidgetProps<TasksConfig>) {
  const tasks = useTasks();
  const { create, toggle, remove, clearCompleted, reorder } = useTaskMutations();
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<TaskFilter>(resolveFilter(config));

  const visible = useMemo(() => {
    if (filter === "pending") return tasks.filter((t) => !t.completed);
    if (filter === "done") return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, filter]);

  const pendingCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);
  const hasCompleted = useMemo(() => tasks.some((t) => t.completed), [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = visible.findIndex((t) => t.id === active.id);
      const newIdx = visible.findIndex((t) => t.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = arrayMove(visible, oldIdx, newIdx);
      // Merge with hidden tasks preserving their relative order
      const visibleIds = new Set(reordered.map((t) => t.id));
      const hidden = tasks.filter((t) => !visibleIds.has(t.id));
      const finalOrder = [...reordered, ...hidden].map((t) => t.id);
      void reorder(finalOrder);
    },
    [visible, tasks, reorder],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const v = input.trim();
      if (!v) return;
      setInput("");
      await create(v);
    },
    [input, create],
  );

  return (
    <div className="flex h-full flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task…"
          className={cn(
            "flex-1 rounded-[var(--radius-sm)]",
            "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
            "px-2.5 py-1.5 text-[13px] text-[var(--color-text-hi)] outline-none",
            "placeholder:text-[var(--color-text-lo)]",
            "focus:border-[var(--color-accent)]",
          )}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Add"
          className={cn(
            "rounded-[var(--radius-sm)] px-2.5 py-1.5",
            "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
            "border border-[oklch(0.68_0.18_270/0.2)]",
            "transition-[background-color] duration-[var(--duration-fast)]",
            "hover:bg-[oklch(0.68_0.18_270/0.18)]",
            "disabled:opacity-40 active:scale-[0.97]",
          )}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </form>

      <div className="flex items-center justify-between gap-2">
        <div role="tablist" className="inline-flex gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-base)] p-0.5">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-[var(--radius-xs)] px-2 py-0.5 text-[11px]",
                  "transition-colors duration-[var(--duration-fast)]",
                  active
                    ? "bg-[var(--color-bg-overlay)] text-[var(--color-text-hi)]"
                    : "text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-[10.5px]">
          {pendingCount > 0 ? (
            <span className="text-[var(--color-accent)]">{pendingCount} pending</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
              <CheckCircle2 className="h-3 w-3" aria-hidden /> done
            </span>
          )}
          {hasCompleted && (
            <button
              type="button"
              onClick={() => void clearCompleted()}
              className="text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visible.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="-mr-1 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {visible.length === 0 && (
                <motion.li
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: duration.fast, ease: easing.standard }}
                  className="py-6 text-center text-[12px] text-[var(--color-text-lo)]"
                >
                  {filter === "done" ? "Nothing completed yet." : "Nothing here — enjoy your day."}
                </motion.li>
              )}
              {visible.map((t) => (
                <SortableRow
                  key={t.id}
                  task={t}
                  onToggle={() => void toggle(t.id, !t.completed)}
                  onRemove={() => void remove(t.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

interface SortableRowProps {
  task: DbTask;
  onToggle: () => void;
  onRemove: () => void;
}

function SortableRow({ task, onToggle, onRemove }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <motion.li
      ref={setNodeRef}
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 4 }}
      transition={{ duration: duration.fast, ease: easing.standard }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : "auto",
      }}
      className={cn(
        "group flex items-center gap-1.5 rounded-[var(--radius-sm)] px-1.5 py-1.5",
        "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
        "transition-[border-color,box-shadow] duration-[var(--duration-fast)]",
        "hover:border-[var(--color-border-strong)]",
        isDragging && "border-[var(--color-accent)] shadow-[var(--shadow-md)]",
      )}
    >
      <button
        type="button"
        aria-label="Drag"
        {...attributes}
        {...listeners}
        className={cn(
          "flex h-4 w-3 cursor-grab items-center justify-center",
          "text-[var(--color-text-lo)] opacity-0 transition-opacity",
          "group-hover:opacity-100 active:cursor-grabbing",
        )}
      >
        <GripVertical className="h-3 w-3" aria-hidden />
      </button>
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        onClick={onToggle}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center",
          "rounded-[4px] border-[1.5px]",
          "transition-[background-color,border-color] duration-[var(--duration-fast)]",
          task.completed
            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
            : "border-[var(--color-border-strong)] hover:border-[var(--color-text-lo)]",
        )}
      >
        {task.completed && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden>
            <path
              d="M2.5 6.5 5 9l4.5-5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <span
        className={cn(
          "flex-1 text-[13px]",
          task.completed
            ? "text-[var(--color-text-lo)] line-through"
            : "text-[var(--color-text-hi)]",
        )}
      >
        {task.content}
      </span>
      <button
        type="button"
        aria-label="Delete"
        onClick={onRemove}
        className={cn(
          "flex h-5 w-5 items-center justify-center",
          "rounded-[var(--radius-xs)] text-[var(--color-text-lo)]",
          "opacity-0 transition-opacity duration-[var(--duration-fast)]",
          "hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]",
          "group-hover:opacity-100",
        )}
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </motion.li>
  );
}

export const TasksWidget = memo(TasksWidgetInner);
