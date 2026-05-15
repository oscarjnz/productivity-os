"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import { getDb, type OutboxEntity } from "@/lib/db/dexie";
import { listPendingOps, markOpDone, markOpFailed } from "@/lib/db/outbox";
import { supabaseEnv } from "@/lib/supabase/env";

export type SyncStatus = "idle" | "syncing" | "offline" | "error";

interface EngineOptions {
  /** ms between drain attempts when ops are queued. */
  drainInterval?: number;
  /** ms between full reconciliation pulls. */
  reconcileInterval?: number;
}

const ENTITY_ROW_KEY: Record<OutboxEntity, "id"> = {
  widget_instances: "id",
  tasks: "id",
  notes: "id",
  bookmarks: "id",
};

/**
 * Sync engine — runs in the browser. Lifecycle:
 *   start()  → kick first drain, schedule timers, attach online listener
 *   stop()   → clear timers + listeners
 *
 * If Supabase isn't configured OR no user is logged in, the engine still runs
 * but cloud writes are skipped (ops stay in outbox until auth happens).
 */
export class SyncEngine {
  private drainTimer: ReturnType<typeof setInterval> | null = null;
  private status: SyncStatus = "idle";
  private listeners = new Set<(s: SyncStatus) => void>();
  private opts: Required<EngineOptions>;
  private running = false;

  constructor(opts: EngineOptions = {}) {
    this.opts = {
      drainInterval: opts.drainInterval ?? 2_500,
      reconcileInterval: opts.reconcileInterval ?? 60_000,
    };
  }

  onStatusChange(cb: (s: SyncStatus) => void): () => void {
    this.listeners.add(cb);
    cb(this.status);
    return () => this.listeners.delete(cb);
  }

  private setStatus(next: SyncStatus): void {
    if (this.status === next) return;
    this.status = next;
    for (const cb of this.listeners) cb(next);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    void this.drain();
    this.drainTimer = setInterval(() => void this.drain(), this.opts.drainInterval);

    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  stop(): void {
    this.running = false;
    if (this.drainTimer) clearInterval(this.drainTimer);
    this.drainTimer = null;
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
  }

  private handleOnline = (): void => {
    this.setStatus("idle");
    void this.drain();
  };

  private handleOffline = (): void => {
    this.setStatus("offline");
  };

  /**
   * Drain pending outbox ops to Supabase.
   * No-op if not configured / not authenticated / offline / queue empty.
   */
  async drain(): Promise<void> {
    if (!this.running) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.setStatus("offline");
      return;
    }
    if (!supabaseEnv.isConfigured) return;

    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // wait for login — ops stay queued

    const db = getDb();
    if (!db) return;

    const pending = await listPendingOps(50);
    if (pending.length === 0) {
      this.setStatus("idle");
      return;
    }

    this.setStatus("syncing");
    let hadError = false;

    for (const op of pending) {
      // Skip ops that have failed too many times — let user retry manually.
      if (op.attempts >= 5) continue;

      try {
        const table = op.entity;
        const payload = (op.payload ?? {}) as never;
        if (op.op === "delete") {
          const { error } = await supabase.from(table).delete().eq("id", op.rowId);
          if (error) throw error;
        } else if (op.op === "insert") {
          const { error } = await supabase.from(table).upsert(payload);
          if (error) throw error;
        } else {
          const keyCol = ENTITY_ROW_KEY[op.entity];
          const { error } = await supabase
            .from(table)
            .update(payload)
            .eq(keyCol, op.rowId);
          if (error) throw error;
        }
        await markOpDone(op.id);
      } catch (err) {
        hadError = true;
        const msg = err instanceof Error ? err.message : String(err);
        await markOpFailed(op.id, msg);
      }
    }

    this.setStatus(hadError ? "error" : "idle");
  }
}

// Singleton — created lazily so SSR doesn't touch IndexedDB.
let _engine: SyncEngine | null = null;
export function getSyncEngine(): SyncEngine {
  if (!_engine) _engine = new SyncEngine();
  return _engine;
}
