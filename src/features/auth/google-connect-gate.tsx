"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db/dexie";
import { connectGoogleServices, GOOGLE_TOKENS_META_KEY } from "./google-services";
import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

/** Reactive: true once Google service tokens are stored in Dexie. */
export function useGoogleServicesConnected(): boolean {
  const row = useLiveQuery(
    async () => {
      const db = getDb();
      if (!db) return null;
      return db.meta.get(GOOGLE_TOKENS_META_KEY);
    },
    [],
    null,
  );
  return !!row;
}

export function GoogleConnectGate({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  const { configured, user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (): Promise<void> => {
    try {
      await connectGoogleServices();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
    }
  };

  if (!configured) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-[11.5px] text-[var(--color-text-lo)]">
        Supabase auth not configured.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="text-[var(--color-text-lo)]">{icon}</span>
      <div className="flex flex-col gap-1">
        <div className="text-[12.5px] text-[var(--color-text-hi)]">{label}</div>
        <div className="text-[10.5px] leading-snug text-[var(--color-text-lo)]">
          {user
            ? "Grant read-only access to Calendar & Gmail."
            : "Sign in first, then connect Google services."}
        </div>
      </div>
      {user && (
        <button
          type="button"
          onClick={() => void handleConnect()}
          className={cn(
            "rounded-[var(--radius-sm)] px-3 py-1.5",
            "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
            "border border-[oklch(0.68_0.18_270/0.2)]",
            "text-[12px] font-medium",
            "transition-[background-color] duration-[var(--duration-fast)]",
            "hover:bg-[oklch(0.68_0.18_270/0.18)] active:scale-[0.97]",
          )}
        >
          Connect Google
        </button>
      )}
      {error && <div className="text-[10.5px] text-[var(--color-danger)]">{error}</div>}
    </div>
  );
}
