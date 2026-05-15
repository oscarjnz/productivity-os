"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import { getDb, type DbBookmark, type DbNote, type DbTask, type OutboxEntity } from "@/lib/db/dexie";
import { enqueueOp } from "@/lib/db/outbox";

export const LOCAL_USER_ID = "__local__";

/**
 * For each user-scoped entity (tasks / notes / bookmarks):
 *   1. Pull cloud rows for this user.
 *   2. If cloud has rows → replace local.
 *   3. If cloud empty but local has rows → remap user_id and push to outbox.
 *   4. Drop stale outbox ops for this entity (they may reference __local__).
 *
 * Returns the operation taken so the caller can log/telemetry.
 */
async function syncUserEntity<
  T extends { id: string; user_id: string },
>(opts: {
  entity: OutboxEntity;
  userId: string;
  table: {
    toArray: () => Promise<T[]>;
    clear: () => Promise<void>;
    put: (row: T) => Promise<unknown>;
  };
}): Promise<"pulled" | "pushed" | "noop" | "skipped"> {
  const supabase = getSupabaseBrowser();
  const db = getDb();
  if (!supabase || !db) return "skipped";

  const { data: cloudRows, error } = await supabase
    .from(opts.entity)
    .select("*")
    .eq("user_id", opts.userId);
  if (error) return "skipped";

  const localRows = await opts.table.toArray();

  await db.outbox.where("entity").equals(opts.entity).delete();

  if ((cloudRows?.length ?? 0) > 0) {
    await opts.table.clear();
    for (const row of cloudRows as unknown as T[]) {
      await opts.table.put(row);
    }
    return "pulled";
  }

  if (localRows.length > 0) {
    await opts.table.clear();
    for (const row of localRows) {
      const remapped = { ...row, user_id: opts.userId };
      await opts.table.put(remapped);
      await enqueueOp(opts.entity, "insert", remapped.id, remapped as unknown as Record<string, unknown>);
    }
    return "pushed";
  }

  return "noop";
}

export async function syncTasks(userId: string) {
  const db = getDb();
  if (!db) return "skipped" as const;
  return syncUserEntity<DbTask>({ entity: "tasks", userId, table: db.tasks });
}

export async function syncNotes(userId: string) {
  const db = getDb();
  if (!db) return "skipped" as const;
  return syncUserEntity<DbNote>({ entity: "notes", userId, table: db.notes });
}

export async function syncBookmarks(userId: string) {
  const db = getDb();
  if (!db) return "skipped" as const;
  return syncUserEntity<DbBookmark>({ entity: "bookmarks", userId, table: db.bookmarks });
}

// ============================================================================
// Realtime subscriptions (one per entity)
// ============================================================================

function subscribeUserEntity<T extends { id: string; user_id: string; updated_at?: string }>(opts: {
  entity: OutboxEntity;
  userId: string;
  table: {
    get: (id: string) => Promise<T | undefined>;
    put: (row: T) => Promise<unknown>;
    delete: (id: string) => Promise<void>;
  };
}): () => void {
  const supabase = getSupabaseBrowser();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`${opts.entity}:${opts.userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: opts.entity,
        filter: `user_id=eq.${opts.userId}`,
      },
      async (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id;
          if (id) await opts.table.delete(id);
          return;
        }
        const row = payload.new as T;
        const local = await opts.table.get(row.id);
        if (local && local.updated_at && row.updated_at && local.updated_at >= row.updated_at) return;
        await opts.table.put(row);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeTasks(userId: string): () => void {
  const db = getDb();
  if (!db) return () => {};
  return subscribeUserEntity<DbTask>({ entity: "tasks", userId, table: db.tasks });
}

export function subscribeNotes(userId: string): () => void {
  const db = getDb();
  if (!db) return () => {};
  return subscribeUserEntity<DbNote>({ entity: "notes", userId, table: db.notes });
}

export function subscribeBookmarks(userId: string): () => void {
  const db = getDb();
  if (!db) return () => {};
  return subscribeUserEntity<DbBookmark>({ entity: "bookmarks", userId, table: db.bookmarks });
}
