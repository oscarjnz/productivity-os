import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Middleware session refresh. Call from `src/middleware.ts`.
 * - Refreshes the access token if expired
 * - Propagates Set-Cookie back to the browser
 *
 * If Supabase isn't configured, this is a no-op pass-through.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  if (!supabaseEnv.isConfigured) return response;

  const supabase = createServerClient<Database>(
    supabaseEnv.url,
    supabaseEnv.anonKey,
    {
      cookies: {
        get(name: string): string | undefined {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions): void {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions): void {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    },
  );

  // Touch the session — forces a refresh if needed.
  await supabase.auth.getUser();

  return response;
}
