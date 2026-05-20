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
 * Strategy (cloud-first — the user's account is the source of truth):
 *   1. Look up user's default dashboard (auto-created by handle_new_user trigger).
 *   2. If cloud has widgets → REPLACE local with cloud. (Same account on any
 *      device shows the same dashboard. Local-only widgets — likely guest-mode
 *      leftovers from a different account — are discarded; if a user wants to
 *      keep them, they should sign in BEFORE customizing.)
 *   3. If cloud is empty AND local has widgets → first-time login from a guest
 *      session: migrate local up to the cloud, remapping the placeholder
 *      "default" dashboardId to the real one.
 *   4. If both empty → noop (user lands on empty-state CTA).
 *   5. Clean stale outbox ops that referenced the placeholder dashboardId.
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

  // Drop ALL stale outbox ops for widgets — anything pending here was created
  // before we knew the real dashboardId (placeholder "default") and would
  // either error out on RLS or push to the wrong dashboard.
  await db.outbox.where("entity").equals("widget_instances").delete();

  // ---- Case A: cloud has widgets → cloud wins, replace local entirely. ---
  if (cloudWidgets.length > 0) {
    await db.widget_instances.clear();
    for (const c of cloudWidgets) {
      await db.widget_instances.put({
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
        updated_at: c.updated_at ?? new Date().toISOString(),
      });
    }
    useLayoutStore.getState()._replaceAll(cloudWidgets.map((c) => fromCloud(c)));
    return { status: "merged", dashboardId };
  }

  // ---- Case B: cloud empty, local has guest-mode widgets → push them up.--
  const localWidgets = await db.widget_instances.toArray();
  if (localWidgets.length > 0) {
    const migrated: MergeRow[] = [];
    for (const l of localWidgets) {
      migrated.push({
        id: l.id,
        dashboard_id: dashboardId,
        type: l.type,
        pos_x: l.pos_x,
        pos_y: l.pos_y,
        width: l.width,
        height: l.height,
        config: l.config,
        z_order: l.z_order,
        created_at: l.created_at,
        updated_at: l.updated_at ?? new Date().toISOString(),
      });
    }

    // Rewrite Dexie with the remapped rows (dashboard_id now points to the
    // real cloud dashboard) and queue the upload.
    await db.widget_instances.clear();
    for (const row of migrated) {
      await db.widget_instances.put(row);
      const inst = fromCloud(row as unknown as CloudWidget);
      await enqueueOp("widget_instances", "insert", inst.id, toCloudRow(inst, dashboardId));
    }

    useLayoutStore
      .getState()
      ._replaceAll(migrated.map((r) => fromCloud(r as unknown as CloudWidget)));

    return { status: "merged", dashboardId };
  }

  // ---- Case C: both empty → user sees the empty-state CTA. ---------------
  await db.widget_instances.clear();
  useLayoutStore.getState()._replaceAll([]);
  return { status: "noop", dashboardId };
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
