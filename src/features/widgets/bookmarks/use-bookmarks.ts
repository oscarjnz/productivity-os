"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { getDb, type DbBookmark } from "@/lib/db/dexie";
import { enqueueOp } from "@/lib/db/outbox";
import { effectiveUserId, newRowId, nowIso } from "@/lib/db/helpers";
import { useAuth } from "@/features/auth/auth-provider";

export function useBookmarks(): DbBookmark[] {
  const { user } = useAuth();
  const uid = effectiveUserId(user?.id);

  const rows = useLiveQuery(
    async () => {
      const db = getDb();
      if (!db) return [];
      return db.bookmarks.where("user_id").equals(uid).toArray();
    },
    [uid],
    [] as DbBookmark[],
  );

  return useMemo(() => {
    const out = [...(rows ?? [])];
    out.sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return a.created_at.localeCompare(b.created_at);
    });
    return out;
  }, [rows]);
}

export interface BookmarkInput {
  label: string;
  url: string;
  icon?: string | null;
  groupName?: string | null;
}

export interface BookmarkMutations {
  create: (input: BookmarkInput) => Promise<void>;
  update: (id: string, patch: Partial<BookmarkInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function useBookmarkMutations(): BookmarkMutations {
  const { user } = useAuth();
  const uid = effectiveUserId(user?.id);

  return useMemo<BookmarkMutations>(
    () => ({
      create: async ({ label, url, icon, groupName }) => {
        const db = getDb();
        if (!db) return;
        const nl = label.trim();
        const nu = normalizeUrl(url);
        if (!nl || !nu) return;
        const row: DbBookmark = {
          id: newRowId(),
          user_id: uid,
          label: nl,
          url: nu,
          icon: icon ?? null,
          group_name: groupName?.trim() || null,
          position: Date.now(),
          created_at: nowIso(),
        };
        await db.bookmarks.put(row);
        await enqueueOp("bookmarks", "insert", row.id, row as unknown as Record<string, unknown>);
      },

      update: async (id, patch) => {
        const db = getDb();
        if (!db) return;
        const next: Record<string, unknown> = {};
        if (patch.label !== undefined) next["label"] = patch.label.trim();
        if (patch.url !== undefined) next["url"] = normalizeUrl(patch.url);
        if (patch.icon !== undefined) next["icon"] = patch.icon || null;
        if (patch.groupName !== undefined) next["group_name"] = patch.groupName?.trim() || null;
        if (Object.keys(next).length === 0) return;
        await db.bookmarks.update(id, next);
        await enqueueOp("bookmarks", "update", id, next);
      },

      remove: async (id) => {
        const db = getDb();
        if (!db) return;
        await db.bookmarks.delete(id);
        await enqueueOp("bookmarks", "delete", id, null);
      },

      reorder: async (orderedIds) => {
        const db = getDb();
        if (!db) return;
        for (let i = 0; i < orderedIds.length; i++) {
          const id = orderedIds[i]!;
          const patch = { position: i };
          await db.bookmarks.update(id, patch);
          await enqueueOp("bookmarks", "update", id, patch as Record<string, unknown>);
        }
      },
    }),
    [uid],
  );
}

export function faviconUrl(url: string): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return "";
  }
}
