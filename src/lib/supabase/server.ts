import "server-only";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

// Derive from the factory so the generic arity always matches the installed
// @supabase/ssr version (avoids SupabaseClient<Database> shape drift).
type Client = ReturnType<typeof createServerClient<Database>>;

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
