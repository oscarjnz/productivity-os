"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { getDb, type DbNote } from "@/lib/db/dexie";
import { enqueueOp } from "@/lib/db/outbox";
import { effectiveUserId, newRowId, nowIso } from "@/lib/db/helpers";
import { useAuth } from "@/features/auth/auth-provider";

export function useNotes(): DbNote[] {
  const { user } = useAuth();
  const uid = effectiveUserId(user?.id);

  const rows = useLiveQuery(
    async () => {
      const db = getDb();
      if (!db) return [];
      return db.notes.where("user_id").equals(uid).toArray();
    },
    [uid],
    [] as DbNote[],
  );

  return useMemo(() => {
    const out = [...(rows ?? [])];
    out.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return out;
  }, [rows]);
}

export interface NoteMutations {
  create: (colorIndex?: number) => Promise<string | null>;
  setContent: (id: string, content: string) => Promise<void>;
  setColor: (id: string, colorIndex: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useNoteMutations(): NoteMutations {
  const { user } = useAuth();
  const uid = effectiveUserId(user?.id);

  return useMemo<NoteMutations>(
    () => ({
      create: async (colorIndex = 0) => {
        const db = getDb();
        if (!db) return null;
        const row: DbNote = {
          id: newRowId(),
          user_id: uid,
          content: "",
          color_index: colorIndex,
          pos_x: 0,
          pos_y: 0,
          pinned: false,
          created_at: nowIso(),
          updated_at: nowIso(),
        };
        await db.notes.put(row);
        await enqueueOp("notes", "insert", row.id, row as unknown as Record<string, unknown>);
        return row.id;
      },

      setContent: async (id, content) => {
        const db = getDb();
        if (!db) return;
        const patch = { content, updated_at: nowIso() };
        await db.notes.update(id, patch);
        await enqueueOp("notes", "update", id, patch as Record<string, unknown>);
      },

      setColor: async (id, color_index) => {
        const db = getDb();
        if (!db) return;
        const patch = { color_index, updated_at: nowIso() };
        await db.notes.update(id, patch);
        await enqueueOp("notes", "update", id, patch as Record<string, unknown>);
      },

      remove: async (id) => {
        const db = getDb();
        if (!db) return;
        await db.notes.delete(id);
        await enqueueOp("notes", "delete", id, null);
      },
    }),
    [uid],
  );
}
