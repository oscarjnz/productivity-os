"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNotes, useNoteMutations } from "./use-notes";
import { NOTE_THEMES, type NotesConfig } from "./config";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";
import type { WidgetProps } from "@/types/widget.types";

interface NoteCardProps {
  id: string;
  content: string;
  colorIndex: number;
  onChange: (id: string, content: string) => void;
  onColor: (id: string, ci: number) => void;
  onDelete: (id: string) => void;
  autoFocus?: boolean;
}

function NoteCard({ id, content, colorIndex, onChange, onColor, onDelete, autoFocus }: NoteCardProps) {
  const theme = NOTE_THEMES[colorIndex % NOTE_THEMES.length]!;
  const [local, setLocal] = useState(content);
  const [editing, setEditing] = useState(!!autoFocus || content.length === 0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (document.activeElement === taRef.current) return;
    setLocal(content);
  }, [content]);

  useEffect(() => {
    if (autoFocus && editing) {
      taRef.current?.focus();
    }
  }, [autoFocus, editing]);

  const handleChange = useCallback(
    (next: string) => {
      setLocal(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(id, next), 400);
    },
    [id, onChange],
  );

  const enterEdit = (): void => setEditing(true);
  const exitEdit = (): void => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      onChange(id, local);
      debounceRef.current = null;
    }
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: duration.fast, ease: easing.standard }}
      className={cn(
        "group flex h-[140px] w-full flex-col rounded-[var(--radius-md)] p-2.5",
        "shadow-[var(--shadow-sm)]",
      )}
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
      }}
    >
      <header className="flex items-center justify-between gap-1">
        <button
          type="button"
          aria-label="Change color"
          onClick={() => onColor(id, (colorIndex + 1) % NOTE_THEMES.length)}
          className="h-2.5 w-2.5 rounded-full transition-transform hover:scale-125"
          style={{ background: theme.dot }}
        />
        <button
          type="button"
          aria-label="Delete note"
          onClick={() => onDelete(id)}
          className="opacity-30 transition-opacity hover:opacity-100"
          style={{ color: theme.text }}
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      </header>

      {editing ? (
        <textarea
          ref={taRef}
          value={local}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={exitEdit}
          placeholder="Type… **bold**, `code`, ```fenced```"
          className={cn(
            "mt-1 flex-1 resize-none bg-transparent outline-none",
            "text-[12.5px] leading-[1.55]",
            "placeholder:opacity-30",
          )}
          style={{ color: theme.text }}
        />
      ) : (
        <button
          type="button"
          onClick={enterEdit}
          className={cn(
            "mt-1 flex-1 cursor-text overflow-y-auto text-left",
            "text-[12.5px] leading-[1.55] outline-none",
          )}
          style={{ color: theme.text }}
        >
          {local.trim() ? (
            <Markdown text={local} />
          ) : (
            <span className="opacity-30">Empty — click to write</span>
          )}
        </button>
      )}
    </motion.div>
  );
}

function NotesWidgetInner({ config }: WidgetProps<NotesConfig>) {
  const notes = useNotes();
  const { create, setContent, setColor, remove } = useNoteMutations();
  const [focusId, setFocusId] = useState<string | null>(null);

  const handleAdd = useCallback(async () => {
    const id = await create(config.defaultColorIndex);
    if (id) setFocusId(id);
  }, [create, config.defaultColorIndex]);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </span>
        <button
          type="button"
          onClick={() => void handleAdd()}
          className={cn(
            "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1",
            "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
            "border border-[oklch(0.68_0.18_270/0.2)]",
            "text-[11.5px] font-medium",
            "transition-[background-color] duration-[var(--duration-fast)]",
            "hover:bg-[oklch(0.68_0.18_270/0.18)] active:scale-[0.97]",
          )}
        >
          <Plus className="h-3 w-3" aria-hidden />
          New
        </button>
      </div>

      <div className="-mr-1 grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full flex h-full items-center justify-center py-6 text-[12px] text-[var(--color-text-lo)]"
            >
              No notes yet — click <span className="mx-1 text-[var(--color-accent)]">New</span> to add one.
            </motion.div>
          ) : (
            notes.map((n) => (
              <NoteCard
                key={n.id}
                id={n.id}
                content={n.content}
                colorIndex={n.color_index}
                autoFocus={focusId === n.id}
                onChange={(id, c) => void setContent(id, c)}
                onColor={(id, ci) => void setColor(id, ci)}
                onDelete={(id) => void remove(id)}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const NotesWidget = memo(NotesWidgetInner);
