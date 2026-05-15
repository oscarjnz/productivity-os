/**
 * Public Supabase config. Validated at module load.
 * The app is designed to work *without* Supabase configured — when env vars
 * are missing, the sync engine falls back to local-only (Dexie) mode.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseEnv = {
  url,
  anonKey,
  /** True only if both URL and anon key are present and non-empty. */
  isConfigured: url.length > 0 && anonKey.length > 0,
} as const;
