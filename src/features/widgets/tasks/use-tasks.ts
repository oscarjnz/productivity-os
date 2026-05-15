"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { getDb, type DbTask } from "@/lib/db/dexie";
import { enqueueOp } from "@/lib/db/outbox";
import { effectiveUserId, newRowId, nowIso } from "@/lib/db/helpers";
import { useAuth } from "@/features/auth/auth-provider";

export function useTasks(): DbTask[] {
  const { user } = useAuth();
  const uid = effectiveUserId(user?.id);

  const rows = useLiveQuery(
    async () => {
      const db = getDb();
      if (!db) return [];
      return db.tasks.where("user_id").equals(uid).toArray();
    },
    [uid],
    [] as DbTask[],
  );

  // Sort: pending first by position, then completed.
  return useMemo(() => {
    const out = [...(rows ?? [])];
    out.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.position !== b.position) return a.position - b.position;
      return a.created_at.localeCompare(b.created_at);
    });
    return out;
  }, [rows]);
}

export interface TaskMutations {
  create: (content: string) => Promise<void>;
  toggle: (id: string, completed: boolean) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;
}

export function useTaskMutations(): TaskMutations {
  const { user } = useAuth();
  const uid = effectiveUserId(user?.id);

  return useMemo<TaskMutations>(
    () => ({
      create: async (content) => {
        const db = getDb();
        if (!db) return;
        const trimmed = content.trim();
        if (!trimmed) return;
        const row: DbTask = {
          id: newRowId(),
          user_id: uid,
          content: trimmed,
          completed: false,
          priority: 0,
          due_at: null,
          position: Date.now(),
          created_at: nowIso(),
          updated_at: nowIso(),
        };
        await db.tasks.put(row);
        await enqueueOp("tasks", "insert", row.id, row as unknown as Record<string, unknown>);
      },

      toggle: async (id, completed) => {
        const db = getDb();
        if (!db) return;
        const patch = { completed, updated_at: nowIso() };
        await db.tasks.update(id, patch);
        await enqueueOp("tasks", "update", id, patch as Record<string, unknown>);
      },

      remove: async (id) => {
        const db = getDb();
        if (!db) return;
        await db.tasks.delete(id);
        await enqueueOp("tasks", "delete", id, null);
      },

      clearCompleted: async () => {
        const db = getDb();
        if (!db) return;
        const completed = await db.tasks
          .where("user_id")
          .equals(uid)
          .filter((t) => t.completed)
          .toArray();
        for (const t of completed) {
          await db.tasks.delete(t.id);
          await enqueueOp("tasks", "delete", t.id, null);
        }
      },

      reorder: async (orderedIds) => {
        const db = getDb();
        if (!db) return;
        const updatedAt = nowIso();
        for (let i = 0; i < orderedIds.length; i++) {
          const id = orderedIds[i]!;
          const patch = { position: i, updated_at: updatedAt };
          await db.tasks.update(id, patch);
          await enqueueOp("tasks", "update", id, patch as Record<string, unknown>);
        }
      },
    }),
    [uid],
  );
}
