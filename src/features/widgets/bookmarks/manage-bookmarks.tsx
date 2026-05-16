"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Pencil, Check } from "lucide-react";
import { useBookmarks, useBookmarkMutations, faviconUrl } from "./use-bookmarks";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";
import type { DbBookmark } from "@/lib/db/dexie";

interface ManageBookmarksProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageBookmarks({ open, onOpenChange }: ManageBookmarksProps) {
  const bookmarks = useBookmarks();
  const { create, update, remove } = useBookmarkMutations();

  // Suggest group names from existing bookmarks
  const existingGroups = Array.from(
    new Set(bookmarks.map((b) => b.group_name).filter((g): g is string => !!g)),
  );

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [groupName, setGroupName] = useState("");

  const handleAdd = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;
    await create({
      label,
      url,
      icon: icon.trim() || null,
      groupName: groupName.trim() || null,
    });
    setLabel("");
    setUrl("");
    setIcon("");
    // Keep group selected for batch-add convenience
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
                className="fixed inset-0 z-[var(--z-overlay)] bg-black/60 backdrop-blur-md"
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
                  "w-[min(560px,92vw)] max-h-[85vh] overflow-hidden",
                  "rounded-[var(--radius-xl)] glass-hi shadow-[var(--shadow-lg)]",
                )}
              >
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
                  <Dialog.Title className="text-[13px] font-semibold text-[var(--color-text-hi)]">
                    Manage bookmarks
                  </Dialog.Title>
                  <Dialog.Close
                    aria-label="Close"
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-lo)] hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-mid)]"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </Dialog.Close>
                </div>

                <div className="max-h-[48vh] overflow-y-auto p-3">
                  {bookmarks.length === 0 ? (
                    <div className="py-6 text-center text-[12px] text-[var(--color-text-lo)]">
                      No bookmarks yet.
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {bookmarks.map((b) => (
                        <BookmarkRow
                          key={b.id}
                          bookmark={b}
                          existingGroups={existingGroups}
                          onUpdate={(patch) => void update(b.id, patch)}
                          onRemove={() => void remove(b.id)}
                        />
                      ))}
                    </ul>
                  )}
                </div>

                <form
                  onSubmit={handleAdd}
                  className="flex flex-col gap-2 border-t border-[var(--color-border)] p-4"
                >
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
                    Add bookmark
                  </div>
                  <div className="grid grid-cols-[64px_1fr_2fr] gap-2">
                    <input
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      placeholder="🚀"
                      maxLength={4}
                      aria-label="Emoji (optional)"
                      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2 py-1.5 text-center text-[14px] outline-none focus:border-[var(--color-accent)]"
                    />
                    <input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Name"
                      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2.5 py-1.5 text-[12.5px] text-[var(--color-text-hi)] outline-none focus:border-[var(--color-accent)]"
                    />
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://…"
                      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2.5 py-1.5 text-[12.5px] text-[var(--color-text-hi)] outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group (optional)"
                      list="bookmark-groups"
                      className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2.5 py-1.5 text-[12.5px] text-[var(--color-text-hi)] outline-none focus:border-[var(--color-accent)]"
                    />
                    <datalist id="bookmark-groups">
                      {existingGroups.map((g) => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                    <button
                      type="submit"
                      disabled={!label.trim() || !url.trim()}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-3",
                        "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
                        "border border-[oklch(0.68_0.18_270/0.2)]",
                        "text-[12px] font-medium",
                        "transition-[background-color] duration-[var(--duration-fast)]",
                        "hover:bg-[oklch(0.68_0.18_270/0.18)]",
                        "disabled:opacity-40 active:scale-[0.97]",
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                      Add
                    </button>
                  </div>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

interface BookmarkRowProps {
  bookmark: DbBookmark;
  existingGroups: string[];
  onUpdate: (patch: { label?: string; url?: string; icon?: string | null; groupName?: string | null }) => void;
  onRemove: () => void;
}

function BookmarkRow({ bookmark, existingGroups, onUpdate, onRemove }: BookmarkRowProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(bookmark.label);
  const [url, setUrl] = useState(bookmark.url);
  const [icon, setIcon] = useState(bookmark.icon ?? "");
  const [group, setGroup] = useState(bookmark.group_name ?? "");

  useEffect(() => {
    if (!editing) {
      setLabel(bookmark.label);
      setUrl(bookmark.url);
      setIcon(bookmark.icon ?? "");
      setGroup(bookmark.group_name ?? "");
    }
  }, [editing, bookmark.label, bookmark.url, bookmark.icon, bookmark.group_name]);

  const save = (): void => {
    onUpdate({ label, url, icon, groupName: group });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-[var(--color-accent)] bg-[var(--color-bg-raised)] p-2">
        <div className="grid grid-cols-[48px_1fr_2fr] gap-1.5">
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={4}
            placeholder="🚀"
            className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-1.5 py-1 text-center text-[14px] outline-none focus:border-[var(--color-accent)]"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2 py-1 text-[12px] outline-none focus:border-[var(--color-accent)]"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2 py-1 text-[12px] outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-1.5">
          <input
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="Group"
            list="bookmark-groups"
            className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2 py-1 text-[12px] outline-none focus:border-[var(--color-accent)]"
          />
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-[var(--radius-xs)] px-2 py-1 text-[11px] text-[var(--color-text-lo)] hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-mid)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className={cn(
              "inline-flex items-center gap-1 rounded-[var(--radius-xs)] px-2 py-1",
              "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
              "border border-[oklch(0.68_0.18_270/0.2)]",
              "text-[11px] font-medium",
            )}
          >
            <Check className="h-3 w-3" aria-hidden /> Save
          </button>
        </div>
        {existingGroups.length > 0 && (
          <datalist id="bookmark-groups">
            {existingGroups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        )}
      </li>
    );
  }

  return (
    <li
      className={cn(
        "group flex items-center gap-2.5 rounded-[var(--radius-sm)]",
        "border border-[var(--color-border)] bg-[var(--color-bg-raised)]",
        "px-3 py-2",
      )}
    >
      {bookmark.icon ? (
        <span className="text-[16px] leading-none">{bookmark.icon}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={faviconUrl(bookmark.url)}
          alt=""
          width={16}
          height={16}
          loading="lazy"
          decoding="async"
          className="h-4 w-4 rounded-[3px]"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
      )}
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate text-[12.5px] text-[var(--color-text-hi)]">
          {bookmark.label}
        </span>
        {bookmark.group_name && (
          <span className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg-base)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-lo)]">
            {bookmark.group_name}
          </span>
        )}
        <span className="truncate text-[11px] text-[var(--color-text-lo)]">{bookmark.url}</span>
      </div>
      <button
        type="button"
        aria-label="Edit"
        onClick={() => setEditing(true)}
        className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-text-lo)] opacity-0 transition-opacity hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-mid)] group-hover:opacity-100"
      >
        <Pencil className="h-3 w-3" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Remove"
        onClick={onRemove}
        className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-text-lo)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </li>
  );
}
