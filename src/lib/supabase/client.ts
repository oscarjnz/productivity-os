"use client";

import { createBrowserClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

// Derive from the factory so the generic arity always matches the installed
// @supabase/ssr version (avoids SupabaseClient<Database> shape drift).
type Client = ReturnType<typeof createBrowserClient<Database>>;

let _client: Client | null = null;

/**
 * Browser-side Supabase client. Singleton — created on first call.
 * Returns null if Supabase env vars aren't configured (local-only mode).
 */
export function getSupabaseBrowser(): Client | null {
  if (!supabaseEnv.isConfigured) return null;
  if (_client) return _client;

  _client = createBrowserClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      // Default SSR-compatible cookie reads/writes. The library handles encoding.
      get(name: string): string | undefined {
        if (typeof document === "undefined") return undefined;
        const match = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${name}=`));
        return match ? decodeURIComponent(match.split("=")[1] ?? "") : undefined;
      },
      set(name: string, value: string, options: CookieOptions): void {
        if (typeof document === "undefined") return;
        const parts = [`${name}=${encodeURIComponent(value)}`, "path=/"];
        if (options.maxAge) parts.push(`max-age=${options.maxAge}`);
        if (options.domain) parts.push(`domain=${options.domain}`);
        if (options.sameSite) parts.push(`samesite=${options.sameSite}`);
        if (options.secure) parts.push("secure");
        document.cookie = parts.join("; ");
      },
      remove(name: string, options: CookieOptions): void {
        this.set(name, "", { ...options, maxAge: 0 });
      },
    },
  });

  return _client;
}
