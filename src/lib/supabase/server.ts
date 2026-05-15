import "server-only";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

type Client = SupabaseClient<Database>;

/**
 * Server-side Supabase client for RSC and route handlers.
 * Reads/writes session cookies via Next.js `cookies()`.
 * Returns null if Supabase isn't configured.
 */
export async function getSupabaseServer(): Promise<Client | null> {
  if (!supabaseEnv.isConfigured) return null;
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      get(name: string): string | undefined {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions): void {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component — cookies can only be set in
          // route handlers / server actions. Safe to ignore here.
        }
      },
      remove(name: string, options: CookieOptions): void {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // see above
        }
      },
    },
  });
}
