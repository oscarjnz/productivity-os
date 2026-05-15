"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { getDb } from "@/lib/db/dexie";
import { useLayoutStore } from "@/stores/layout.store";
import type { Tables } from "@/lib/supabase/database.types";
import type { WidgetInstance } from "@/types/widget.types";

type CloudWidget = Tables<"widget_instances">;

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

/**
 * Subscribes to widget_instances changes for one dashboard.
 * On insert/update/delete, mirrors the change into Dexie + layout store
 * WITHOUT enqueueing an outbox op (it would re-upload our own writes).
 *
 * Deduping vs. self-writes: every payload carries `updated_at`. We compare
 * with the local row — if the cloud row is older or identical, skip.
 *
 * Returns an unsubscribe function. Call again when the dashboard changes
 * or on signout.
 */
export function subscribeWidgetInstances(dashboardId: string): () => void {
  const supabase = getSupabaseBrowser();
  const db = getDb();
  if (!supabase || !db) return () => {};

  const channel: RealtimeChannel = supabase
    .channel(`widget_instances:${dashboardId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "widget_instances",
        filter: `dashboard_id=eq.${dashboardId}`,
      },
      async (payload) => {
        const event = payload.eventType;

        if (event === "DELETE") {
          const oldId = (payload.old as { id?: string }).id;
          if (!oldId) return;
          await db.widget_instances.delete(oldId);
          useLayoutStore.getState()._applyRemoteDelete(oldId);
          return;
        }

        const row = payload.new as CloudWidget;
        const local = await db.widget_instances.get(row.id);
        if (local && local.updated_at >= row.updated_at) return; // self-write or stale

        await db.widget_instances.put({
          ...row,
          config: (row.config as Record<string, unknown>) ?? {},
        });
        useLayoutStore.getState()._applyRemoteUpsert(fromCloud(row));
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
