"use client";

import { create } from "zustand";
import type { WidgetInstance, WidgetPosition, WidgetSize } from "@/types/widget.types";
import { DEFAULT_GRID, type GridConfig } from "@/features/layout-engine/types";
import {
  clampPosition,
  clampSize,
  findFirstFreePosition,
  instanceToRect,
} from "@/features/layout-engine/grid-utils";
import { getDb } from "@/lib/db/dexie";
import { enqueueOp } from "@/lib/db/outbox";

const LOCAL_DASHBOARD_ID = "default";

interface AddOptions {
  size: WidgetSize;
  defaultConfig: Record<string, unknown>;
  position?: WidgetPosition;
}

interface LayoutState {
  instances: Record<string, WidgetInstance>;
  order: string[];
  grid: GridConfig;
  /** Once Dexie has loaded its snapshot into the store. */
  hydrated: boolean;

  addWidget: (type: string, opts: AddOptions) => string;
  removeWidget: (id: string) => void;
  moveWidget: (id: string, pos: WidgetPosition) => void;
  /** Apply multiple position updates atomically (used by gravity push). */
  bulkMove: (updates: Array<{ id: string; position: WidgetPosition }>) => void;
  resizeWidget: (id: string, size: WidgetSize, minSize: WidgetSize, maxSize?: WidgetSize) => void;
  updateConfig: <T extends Record<string, unknown>>(id: string, config: T) => void;
  resetLayout: () => void;
  /** Internal: bulk apply Dexie snapshot at startup. */
  _hydrateFromDb: (instances: WidgetInstance[]) => void;
  /** Remote upsert from realtime — does NOT enqueue an outbox op. */
  _applyRemoteUpsert: (inst: WidgetInstance) => void;
  /** Remote delete from realtime — does NOT enqueue an outbox op. */
  _applyRemoteDelete: (id: string) => void;
  /** Replace everything (used by initial cloud sync). */
  _replaceAll: (instances: WidgetInstance[]) => void;
  /** Wipe everything in-memory. Used when a user signs out or switches accounts. */
  _clearAll: () => void;
  /** Force the hydrated flag (used after cloud-first init). */
  _setHydrated: (v: boolean) => void;
}

const EMPTY_STATE: Pick<LayoutState, "instances" | "order"> = {
  instances: {},
  order: [],
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toDbRow(inst: WidgetInstance) {
  return {
    id: inst.id,
    dashboard_id: inst.dashboardId,
    type: inst.type,
    pos_x: inst.position.x,
    pos_y: inst.position.y,
    width: inst.size.w,
    height: inst.size.h,
    config: inst.config,
    z_order: inst.zOrder,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function persistInsert(inst: WidgetInstance): Promise<void> {
  const db = getDb();
  if (!db) return;
  const row = toDbRow(inst);
  await db.widget_instances.put(row);
  await enqueueOp("widget_instances", "insert", inst.id, row);
}

// --- debounced update persistence ------------------------------------------
// Rationale: the UI updates the store synchronously on every interaction
// (drag tick, resize, typing in a settings input, etc.). Writing those to
// Dexie + outbox synchronously means one IndexedDB transaction per keystroke
// or per drag tick, which is wasteful even though the outbox compresses
// downstream. Coalescing patches per widget for 800ms reduces that to one
// write per "edit burst" — same end state, much less I/O.
const PERSIST_DEBOUNCE_MS = 800;
const pendingPatches = new Map<string, Record<string, unknown>>();
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

async function flushUpdate(id: string): Promise<void> {
  const patch = pendingPatches.get(id);
  pendingPatches.delete(id);
  const timer = pendingTimers.get(id);
  if (timer) clearTimeout(timer);
  pendingTimers.delete(id);
  if (!patch) return;

  const db = getDb();
  if (!db) return;
  const updated_at = new Date().toISOString();
  await db.widget_instances.update(id, { ...patch, updated_at });
  await enqueueOp("widget_instances", "update", id, { ...patch, updated_at });
}

function persistUpdate(inst: WidgetInstance, patch: Record<string, unknown>): void {
  const prev = pendingPatches.get(inst.id) ?? {};
  pendingPatches.set(inst.id, { ...prev, ...patch });

  const existing = pendingTimers.get(inst.id);
  if (existing) clearTimeout(existing);
  pendingTimers.set(
    inst.id,
    setTimeout(() => void flushUpdate(inst.id), PERSIST_DEBOUNCE_MS),
  );
}

/**
 * Flush every pending debounced write immediately. Call on unmount, pagehide,
 * sign-out, or whenever you want the cloud to catch up RIGHT NOW (no waiting
 * for the 800ms timer to expire).
 */
export async function flushPendingLayoutWrites(): Promise<void> {
  const ids = [...pendingTimers.keys()];
  await Promise.all(ids.map((id) => flushUpdate(id)));
}

async function persistDelete(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.widget_instances.delete(id);
  await enqueueOp("widget_instances", "delete", id, null);
}

export const useLayoutStore = create<LayoutState>()((set, get) => ({
      ...EMPTY_STATE,
      grid: DEFAULT_GRID,
      hydrated: false,

      addWidget: (type, opts) => {
        const id = newId();
        const state = get();
        const rects = state.order
          .map((iid) => state.instances[iid])
          .filter((x): x is WidgetInstance => !!x)
          .map(instanceToRect);
        const pos = opts.position ?? findFirstFreePosition(opts.size, state.grid.cols, rects);

        const instance: WidgetInstance = {
          id,
          type,
          dashboardId: LOCAL_DASHBOARD_ID,
          position: pos,
          size: opts.size,
          config: opts.defaultConfig,
          zOrder: state.order.length,
        };

        set((s) => ({
          instances: { ...s.instances, [id]: instance },
          order: [...s.order, id],
        }));

        void persistInsert(instance);
        return id;
      },

      removeWidget: (id) => {
        set((s) => {
          if (!s.instances[id]) return s;
          const { [id]: _removed, ...rest } = s.instances;
          return { instances: rest, order: s.order.filter((i) => i !== id) };
        });
        void persistDelete(id);
      },

      moveWidget: (id, pos) => {
        const state = get();
        const inst = state.instances[id];
        if (!inst) return;
        const clamped = clampPosition(pos, inst.size, state.grid.cols);
        const next = { ...inst, position: clamped };
        set((s) => ({ instances: { ...s.instances, [id]: next } }));
        void persistUpdate(next, { pos_x: clamped.x, pos_y: clamped.y });
      },

      bulkMove: (updates) => {
        const state = get();
        const nextInstances = { ...state.instances };
        const toPersist: Array<{ inst: WidgetInstance; patch: Record<string, unknown> }> = [];

        for (const { id, position } of updates) {
          const inst = nextInstances[id];
          if (!inst) continue;
          const clamped = clampPosition(position, inst.size, state.grid.cols);
          if (clamped.x === inst.position.x && clamped.y === inst.position.y) continue;
          const updated: WidgetInstance = { ...inst, position: clamped };
          nextInstances[id] = updated;
          toPersist.push({ inst: updated, patch: { pos_x: clamped.x, pos_y: clamped.y } });
        }

        if (toPersist.length === 0) return;
        set({ instances: nextInstances });
        for (const { inst, patch } of toPersist) void persistUpdate(inst, patch);
      },

      resizeWidget: (id, size, minSize, maxSize) => {
        const state = get();
        const inst = state.instances[id];
        if (!inst) return;
        const clamped = clampSize(size, inst.position, state.grid.cols, minSize, maxSize);
        const next = { ...inst, size: clamped };
        set((s) => ({ instances: { ...s.instances, [id]: next } }));
        void persistUpdate(next, { width: clamped.w, height: clamped.h });
      },

      updateConfig: (id, config) => {
        const state = get();
        const inst = state.instances[id];
        if (!inst) return;
        const next = { ...inst, config };
        set((s) => ({ instances: { ...s.instances, [id]: next } }));
        void persistUpdate(next, { config });
      },

      resetLayout: () => {
        const state = get();
        for (const id of state.order) void persistDelete(id);
        set({ ...EMPTY_STATE, grid: DEFAULT_GRID, hydrated: true });
      },

      _hydrateFromDb: (instances) => {
        if (instances.length === 0) {
          set({ hydrated: true });
          return;
        }
        const map: Record<string, WidgetInstance> = {};
        const order: string[] = [];
        for (const inst of instances) {
          map[inst.id] = inst;
          order.push(inst.id);
        }
        set({ instances: map, order, hydrated: true });
      },

      _applyRemoteUpsert: (inst) => {
        set((s) => {
          const exists = !!s.instances[inst.id];
          return {
            instances: { ...s.instances, [inst.id]: inst },
            order: exists ? s.order : [...s.order, inst.id],
          };
        });
      },

      _applyRemoteDelete: (id) => {
        set((s) => {
          if (!s.instances[id]) return s;
          const { [id]: _removed, ...rest } = s.instances;
          return { instances: rest, order: s.order.filter((i) => i !== id) };
        });
      },

      _replaceAll: (instances) => {
        const map: Record<string, WidgetInstance> = {};
        const order: string[] = [];
        for (const inst of instances) {
          map[inst.id] = inst;
          order.push(inst.id);
        }
        set({ instances: map, order, hydrated: true });
      },

      _clearAll: () => {
        set({ ...EMPTY_STATE, grid: DEFAULT_GRID, hydrated: false });
      },

      _setHydrated: (v) => {
        set({ hydrated: v });
      },
}));

// Best-effort: scrub the legacy zustand-persist blob so a stale snapshot from
// a previous account/version can't bleed back in. The cloud (when logged in)
// or Dexie (guest) is now the only source of truth.
if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem("pos.layout");
  } catch {
    // private mode etc — fine, nothing to scrub.
  }
}

/**
 * Pull the canonical layout from Dexie into the store. Call once at app start
 * (guest mode) — when a user is logged in, the auth provider runs the cloud
 * initial sync instead, which is the authoritative source.
 *
 * No auto-seed: an empty dashboard renders the "Add widget" CTA, which is the
 * right UX for both first-run guests and freshly-logged-in users.
 */
export async function hydrateLayoutFromDb(): Promise<void> {
  const db = getDb();
  if (!db) {
    useLayoutStore.setState({ hydrated: true });
    return;
  }

  const rows = await db.widget_instances.toArray();
  if (rows.length === 0) {
    useLayoutStore.setState({ instances: {}, order: [], hydrated: true });
    return;
  }

  const instances: WidgetInstance[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    dashboardId: r.dashboard_id,
    position: { x: r.pos_x, y: r.pos_y },
    size: { w: r.width, h: r.height },
    config: r.config,
    zOrder: r.z_order,
  }));

  useLayoutStore.getState()._hydrateFromDb(instances);
}

/**
 * Wipe local persistence — Dexie, outbox, the zustand-persist localStorage
 * blob, and the in-memory store. Called when a user signs out or a different
 * user logs in, so the next session starts clean and cannot contaminate
 * another account's cloud state.
 */
export async function clearLocalLayoutPersistence(): Promise<void> {
  // Drop any debounced writes still buffered — they belong to the user/account
  // we're about to wipe and must not be flushed afterwards.
  pendingPatches.clear();
  for (const t of pendingTimers.values()) clearTimeout(t);
  pendingTimers.clear();

  const db = getDb();
  if (db) {
    await db.widget_instances.clear();
    await db.outbox.where("entity").equals("widget_instances").delete();
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem("pos.layout");
    } catch {
      // localStorage may be unavailable (private mode); ignore.
    }
  }
  useLayoutStore.getState()._clearAll();
}
