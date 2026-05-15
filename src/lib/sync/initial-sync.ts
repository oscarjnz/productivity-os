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
  status: "skipped" | "pulled" | "pushed" | "noop";
  dashboardId?: string;
  reason?: string;
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

  // Drop any outbox ops for widget_instances — they may reference the
  // placeholder dashboardId and would 409 anyway.
  await db.outbox.where("entity").equals("widget_instances").delete();

  if (cloudWidgets.length > 0) {
    // Cloud wins: replace local with cloud.
    await db.widget_instances.clear();
    for (const row of cloudWidgets) {
      await db.widget_instances.put({
        ...row,
        config: (row.config as Record<string, unknown>) ?? {},
      });
    }
    useLayoutStore.getState()._replaceAll(cloudWidgets.map(fromCloud));
    return { status: "pulled", dashboardId };
  }

  if (localWidgets.length > 0) {
    // Cloud empty: push local with remapped dashboard_id.
    await db.widget_instances.clear();
    const remappedInstances: WidgetInstance[] = [];

    for (const row of localWidgets) {
      const remapped = { ...row, dashboard_id: dashboardId };
      await db.widget_instances.put(remapped);
      const inst = fromCloud(remapped as unknown as CloudWidget);
      remappedInstances.push(inst);
      await enqueueOp("widget_instances", "insert", inst.id, toCloudRow(inst, dashboardId));
    }

    useLayoutStore.getState()._replaceAll(remappedInstances);
    return { status: "pushed", dashboardId };
  }

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
