"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSyncEngine, type SyncStatus } from "./sync-engine";
import { subscribeWidgetInstances } from "./realtime";
import { subscribeTasks, subscribeNotes, subscribeBookmarks } from "./entity-sync";
import { useAuth } from "@/features/auth/auth-provider";
import { useLayoutStore } from "@/stores/layout.store";
import { useToastStore } from "@/stores/toast.store";

interface SyncContextValue {
  status: SyncStatus;
  flush: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  status: "idle",
  flush: async () => {},
});

export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const { user } = useAuth();

  // Surface a sticky toast while sync is in the error state; clear it on
  // recovery. Deduped by a fixed id so a repeating failure never stacks.
  useEffect(() => {
    if (status === "error") {
      useToastStore.getState().push({
        id: "sync-error",
        kind: "error",
        message: "Cloud sync failed — changes are saved locally and will retry.",
        duration: 0,
      });
    } else {
      useToastStore.getState().dismiss("sync-error");
    }
  }, [status]);

  // 1. Drain engine — runs whether or not logged in.
  useEffect(() => {
    const engine = getSyncEngine();
    const unsubscribe = engine.onStatusChange(setStatus);
    engine.start();
    return () => {
      unsubscribe();
      engine.stop();
    };
  }, []);

  // 2. Realtime — only when logged in. Reads dashboard_id from the first
  //    placed widget (after initial sync, every widget points to the real
  //    dashboard). Re-subscribes when the dashboard id changes.
  const dashboardId = useLayoutStore((s) => {
    const firstId = s.order[0];
    if (!firstId) return null;
    const inst = s.instances[firstId];
    if (!inst) return null;
    // Skip the placeholder until initial sync rewrites it.
    if (inst.dashboardId === "default") return null;
    return inst.dashboardId;
  });

  useEffect(() => {
    if (!user || !dashboardId) return;
    const unsubscribe = subscribeWidgetInstances(dashboardId);
    return () => unsubscribe();
  }, [user, dashboardId]);

  // 3. Realtime for user-scoped entities (tasks, notes, bookmarks).
  useEffect(() => {
    if (!user) return;
    const unsubs = [
      subscribeTasks(user.id),
      subscribeNotes(user.id),
      subscribeBookmarks(user.id),
    ];
    return () => unsubs.forEach((u) => u());
  }, [user]);

  const value: SyncContextValue = {
    status,
    flush: () => getSyncEngine().drain(),
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncStatus(): SyncContextValue {
  return useContext(SyncContext);
}
