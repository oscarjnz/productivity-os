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

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  configured: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
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

  // Fire initial sync exactly once per login transition.
  useEffect(() => {
    const userId = session?.user.id ?? null;
    if (userId && userId !== lastUserIdRef.current) {
      lastUserIdRef.current = userId;
      void Promise.all([runFullInitialSync(userId), pullPreferences(userId)]).then(() => {
        void getSyncEngine().drain();
      });
    } else if (!userId) {
      lastUserIdRef.current = null;
    }
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
    await supabase.auth.signOut();
    setSession(null);
  };

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    loading,
    configured: supabaseEnv.isConfigured,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
