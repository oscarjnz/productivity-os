"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { getDb } from "@/lib/db/dexie";
import { apiKeyMetaKey } from "./providers";

/**
 * Per-provider API key. Lives in IndexedDB only — never sent to Supabase or
 * any server. `providerId` namespaces the key so each provider keeps its own.
 */
export function useApiKey(providerId: string) {
  const metaKey = apiKeyMetaKey(providerId);

  const value = useLiveQuery(
    async () => {
      const db = getDb();
      if (!db) return null;
      const row = await db.meta.get(metaKey);
      return (row?.value as string | undefined) ?? null;
    },
    [metaKey],
    null as string | null,
  );

  const setKey = useCallback(
    async (key: string) => {
      const db = getDb();
      if (!db) return;
      const trimmed = key.trim();
      if (!trimmed) await db.meta.delete(metaKey);
      else await db.meta.put({ key: metaKey, value: trimmed });
    },
    [metaKey],
  );

  return { apiKey: value, setApiKey: setKey };
}
