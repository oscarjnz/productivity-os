"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { getDb } from "@/lib/db/dexie";
import { API_KEY_META_KEY } from "./config";

/**
 * API key lives in IndexedDB only — never goes to Supabase or any server.
 * Stored in Dexie's `meta` table under a fixed key.
 */
export function useApiKey() {
  const value = useLiveQuery(
    async () => {
      const db = getDb();
      if (!db) return null;
      const row = await db.meta.get(API_KEY_META_KEY);
      return (row?.value as string | undefined) ?? null;
    },
    [],
    null as string | null,
  );

  const setKey = useCallback(async (key: string) => {
    const db = getDb();
    if (!db) return;
    const trimmed = key.trim();
    if (!trimmed) {
      await db.meta.delete(API_KEY_META_KEY);
    } else {
      await db.meta.put({ key: API_KEY_META_KEY, value: trimmed });
    }
  }, []);

  return { apiKey: value, setApiKey: setKey };
}
