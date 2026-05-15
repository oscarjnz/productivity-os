"use client";

import { getDb, type DbOutboxItem, type OutboxEntity, type OutboxOp } from "./dexie";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function enqueueOp(
  entity: OutboxEntity,
  op: OutboxOp,
  rowId: string,
  payload: Record<string, unknown> | null,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  // Compress consecutive ops on the same row to avoid duplicate work.
  // - insert → update : keep insert with merged payload
  // - update → update : merge payload
  // - * → delete       : replace with single delete
  await db.transaction("rw", db.outbox, async () => {
    const pending = await db.outbox
      .where("entity")
      .equals(entity)
      .filter((o) => o.rowId === rowId)
      .toArray();

    if (op === "delete") {
      for (const p of pending) await db.outbox.delete(p.id);
      await db.outbox.add({
        id: newId(),
        entity,
        op: "delete",
        rowId,
        payload: null,
        createdAt: Date.now(),
        attempts: 0,
        lastError: null,
      });
      return;
    }

    const last = pending.at(-1);
    if (last && (last.op === "insert" || last.op === "update")) {
      await db.outbox.update(last.id, {
        payload: { ...(last.payload ?? {}), ...(payload ?? {}) },
      });
      return;
    }

    await db.outbox.add({
      id: newId(),
      entity,
      op,
      rowId,
      payload,
      createdAt: Date.now(),
      attempts: 0,
      lastError: null,
    });
  });
}

export async function listPendingOps(limit: number = 50): Promise<DbOutboxItem[]> {
  const db = getDb();
  if (!db) return [];
  return db.outbox.orderBy("createdAt").limit(limit).toArray();
}

export async function markOpDone(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.outbox.delete(id);
}

export async function markOpFailed(id: string, error: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const op = await db.outbox.get(id);
  if (!op) return;
  await db.outbox.update(id, {
    attempts: op.attempts + 1,
    lastError: error,
  });
}
