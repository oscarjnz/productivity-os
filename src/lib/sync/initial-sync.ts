"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import { getDb } from "@/lib/db/dexie";
import { enqueueOp } from "@/lib/db/outbox";
import { useLayoutStore } from "@/stores/layout.store";
import { syncTasks, syncNotes, syncBookmarks } from "./entity-sync";
import type { WidgetInstance } from "@/types/widget.types";
import type { Tables } from "@/lib/supabase/database.types";

type CloudWidget = Tables<"widget_instances">;
type CloudDashboard = Tables<"dashboards">;

function fromCloud(row: CloudWidget): WidgetInstance {
  return {
    id: row.id,
    type: row.type,
    dashboardId: row.dashboard_id,
    position: { x: row.pos_x, y: row.pos_y },
    size: { w: row.width, h: row.height },
    config: (row.config as Record<string, unknown>) ?? {},
    zOrder: row.z_order,
  };
}

function toCloudRow(inst: WidgetInstance, dashboardId: string): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    id: inst.id,
    dashboard_id: dashboardId,
    type: inst.type,
    pos_x: inst.position.x,
    pos_y: inst.position.y,
    width: inst.size.w,
    height: inst.size.h,
    config: inst.config,
    z_order: inst.zOrder,
    created_at: now,
    updated_at: now,
  };
}

interface InitialSyncResult {
  status: "skipped" | "merged" | "noop";
  dashboardId?: string;
  reason?: string;
}

interface MergeRow {
  id: string;
  dashboard_id: string;
  type: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  config: Record<string, unknown>;
  z_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Runs the first reconcile between local Dexie and the user's cloud dashboard.
 *
 * Strategy:
 *   1. Look up user's default dashboard (auto-created by handle_new_user trigger).
 *   2. If cloud has widgets → cloud wins, replace local.
 *   3. If cloud is empty but local has widgets → push local up, remapping the
 *      placeholder "default" dashboardId to the real one.
 *   4. Clean stale outbox ops that referenced the old dashboardId.
 */
export async function runInitialSync(userId: string): Promise<InitialSyncResult> {
  const supabase = getSupabaseBrowser();
  const db = getDb();
  if (!supabase || !db) return { status: "skipped", reason: "no_client" };

  // 1. Find user's default dashboard
  const { data: dashboardsRaw, error: dErr } = await supabase
    .from("dashboards")
    .select("*")
    .eq("user_id", userId)
    .eq("is_default", true)
    .limit(1);

  const dashboards = (dashboardsRaw ?? []) as unknown as CloudDashboard[];
  if (dErr || dashboards.length === 0) {
    return { status: "skipped", reason: dErr?.message ?? "no_default_dashboard" };
  }

  const dashboard = dashboards[0]!;
  const dashboardId = dashboard.id;

  // 2. Pull cloud widgets
  const { data: cloudWidgetsRaw, error: wErr } = await supabase
    .from("widget_instances")
    .select("*")
    .eq("dashboard_id", dashboardId);
  const cloudWidgets = (cloudWidgetsRaw ?? []) as unknown as CloudWidget[];

  if (wErr) return { status: "skipped", reason: wErr.message };

  const localWidgets = await db.widget_instances.toArray();

  // Drop stale outbox ops — we re-enqueue exactly what still needs pushing
  // below, with the correct (real) dashboard_id.
  await db.outbox.where("entity").equals("widget_instances").delete();

  // ---- MERGE: union by id, last-write-wins on updated_at ------------------
  // Never wipe local-only widgets just because the cloud doesn't have them
  // yet (that was the "widgets vanish on refresh" bug).
  const merged = new Map<string, MergeRow>();
  const needsPush = new Set<string>();

  for (const c of cloudWidgets) {
    merged.set(c.id, {
      id: c.id,
      dashboard_id: c.dashboard_id,
      type: c.type,
      pos_x: c.pos_x,
      pos_y: c.pos_y,
      width: c.width,
      height: c.height,
      config: (c.config as Record<string, unknown>) ?? {},
      z_order: c.z_order,
      created_at: c.created_at,
      updated_at: c.updated_at ?? "",
    });
  }

  for (const l of localWidgets) {
    const local: MergeRow = {
      id: l.id,
      dashboard_id: dashboardId, // remap placeholder → real
      type: l.type,
      pos_x: l.pos_x,
      pos_y: l.pos_y,
      width: l.width,
      height: l.height,
      config: l.config,
      z_order: l.z_order,
      created_at: l.created_at,
      updated_at: l.updated_at ?? "",
    };
    const existing = merged.get(l.id);
    if (!existing) {
      // Local-only — keep it AND make sure it reaches the cloud.
      merged.set(l.id, local);
      needsPush.add(l.id);
    } else if (local.updated_at > existing.updated_at) {
      // Local edited more recently than cloud — local wins, push it up.
      merged.set(l.id, local);
      needsPush.add(l.id);
    }
    // else: cloud is newer or equal — keep cloud, nothing to push.
  }

  const mergedRows = [...merged.values()];

  // Rewrite Dexie with the full merged set.
  await db.widget_instances.clear();
  for (const row of mergedRows) await db.widget_instances.put(row);

  // Push the rows that the cloud is missing / behind on.
  for (const row of mergedRows) {
    if (!needsPush.has(row.id)) continue;
    const inst = fromCloud(row as unknown as CloudWidget);
    await enqueueOp(
      "widget_instances",
      "insert", // upsert semantics in the sync engine
      inst.id,
      toCloudRow(inst, dashboardId),
    );
  }

  useLayoutStore
    .getState()
    ._replaceAll(mergedRows.map((r) => fromCloud(r as unknown as CloudWidget)));

  if (mergedRows.length === 0) return { status: "noop", dashboardId };
  return { status: "merged", dashboardId };
}

/**
 * Orchestrates the full initial sync after login:
 * widgets first (so realtime knows the dashboardId), then the user-scoped
 * entities (tasks, notes, bookmarks). Each runs sequentially to keep RLS
 * errors easy to attribute.
 */
export async function runFullInitialSync(userId: string) {
  const widgetResult = await runInitialSync(userId);
  await Promise.all([syncTasks(userId), syncNotes(userId), syncBookmarks(userId)]);
  return widgetResult;
}
