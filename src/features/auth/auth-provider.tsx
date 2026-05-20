"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnv } from "@/lib/supabase/env";
import { runFullInitialSync } from "@/lib/sync/initial-sync";
import { getSyncEngine } from "@/lib/sync/sync-engine";
import { pullPreferences, pushPreferences } from "@/lib/sync/preferences-sync";
import { captureGoogleTokens } from "./google-services";
import { usePrefsStore } from "@/stores/prefs.store";
import {
  clearLocalLayoutPersistence,
  flushPendingLayoutWrites,
  useLayoutStore,
} from "@/stores/layout.store";
import { toast } from "@/stores/toast.store";

// Tracks which user the local Dexie/zustand snapshot belongs to. When this
// changes between sessions (account switch), we wipe before re-hydrating.
const LAST_USER_META_KEY = "pos.lastUserId";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  /**
   * True once the layout has been resolved against the user's cloud state
   * (or we've confirmed there is no user, so guest-mode local layout is in
   * effect). The dashboard should render a skeleton until this is true.
   */
  cloudReady: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  configured: false,
  cloudReady: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudReady, setCloudReady] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      // Supabase not configured — pure local/guest mode.
      setLoading(false);
      setCloudReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      // If there's no session, we're done — guest hydration runs from Dexie.
      if (!data.session) setCloudReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Capture Google Calendar/Gmail tokens only if the user explicitly
      // ran the "connect services" flow (flag checked inside).
      if (next) {
        void captureGoogleTokens(next.provider_token, next.provider_refresh_token);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // Resolve the layout against the cloud once per login transition. Also
  // wipes local state when a different user signs in than the one whose
  // snapshot Dexie/localStorage currently holds.
  useEffect(() => {
    const userId = session?.user.id ?? null;

    if (!userId) {
      // Sign-out (or guest land) — drop the lastUser marker. Layout cleanup
      // is performed inside signOut() so a hard refresh after sign-out shows
      // the empty guest state, not the previous account's data.
      lastUserIdRef.current = null;
      return;
    }

    if (userId === lastUserIdRef.current) return;
    lastUserIdRef.current = userId;

    setCloudReady(false);

    (async (): Promise<void> => {
      // Account switch detection: if the local snapshot belongs to a
      // different user, wipe before pulling the new one. This is what was
      // contaminating fresh logins on a new device that had a previous
      // user's data still sitting in IndexedDB / localStorage.
      let previousUserId: string | null = null;
      if (typeof window !== "undefined") {
        try {
          previousUserId = window.localStorage.getItem(LAST_USER_META_KEY);
        } catch {
          previousUserId = null;
        }
      }
      if (previousUserId && previousUserId !== userId) {
        await clearLocalLayoutPersistence();
      }
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(LAST_USER_META_KEY, userId);
        } catch {
          // ignore
        }
      }

      try {
        const [widgetResult] = await Promise.all([
          runFullInitialSync(userId),
          pullPreferences(userId),
        ]);
        // Surface what actually happened so we can diagnose missing-sync
        // reports without asking the user to open devtools.
        if (widgetResult) {
          if (widgetResult.status === "pulled") {
            toast.success(`Cloud sync: pulled ${widgetResult.pulledCount ?? 0} widgets`);
          } else if (widgetResult.status === "pushed") {
            toast.success(`Cloud sync: pushed ${widgetResult.pushedCount ?? 0} widgets`);
          } else if (widgetResult.status === "noop") {
            toast.info("Cloud sync: no widgets yet");
          } else if (widgetResult.status === "skipped") {
            toast.error(
              `Cloud sync skipped: ${widgetResult.reason ?? "unknown"}`,
              "sync-init-skipped",
            );
          }
        }
      } finally {
        useLayoutStore.getState()._setHydrated(true);
        setCloudReady(true);
        void getSyncEngine().drain();
      }
    })();
  }, [session]);

  // Debounced push of preferences whenever they change AND we're logged in.
  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = usePrefsStore.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void pushPreferences(userId), 800);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, [session]);

  const signOut = async (): Promise<void> => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    // Push any debounced edits up before tearing down, so the user doesn't
    // lose the last few seconds of changes on log-out.
    await flushPendingLayoutWrites();
    await getSyncEngine().drain();
    await supabase.auth.signOut();
    setSession(null);
    // Wipe local persistence so the next account that logs in on this device
    // (or this same device used as guest) starts from a clean slate.
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(LAST_USER_META_KEY);
      } catch {
        // ignore
      }
    }
    await clearLocalLayoutPersistence();
    useLayoutStore.getState()._setHydrated(true);
    setCloudReady(true);
  };

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    loading,
    configured: supabaseEnv.isConfigured,
    cloudReady,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
