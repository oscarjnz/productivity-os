"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import { usePrefsStore, type AccentHue, type Density } from "@/stores/prefs.store";

interface CloudPreferences {
  density?: Density;
  accent?: AccentHue;
  reducedMotion?: boolean;
  locale?: string | null;
  timezone?: string | null;
}

/**
 * Pull preferences from the user's profile and merge into the local store.
 * Called once after login. Local store wins for keys missing on the cloud.
 */
export async function pullPreferences(userId: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .single();

  if (error || !data) return;
  const cloud = ((data as { preferences?: unknown }).preferences as CloudPreferences) ?? {};

  const state = usePrefsStore.getState();
  if (cloud.density && cloud.density !== state.density) state.setDensity(cloud.density);
  if (cloud.accent && cloud.accent !== state.accent) state.setAccent(cloud.accent);
  if (typeof cloud.reducedMotion === "boolean" && cloud.reducedMotion !== state.reducedMotion) {
    state.setReducedMotion(cloud.reducedMotion);
  }
  if (cloud.locale !== undefined && cloud.locale !== state.locale) state.setLocale(cloud.locale);
  if (cloud.timezone !== undefined && cloud.timezone !== state.timezone) state.setTimezone(cloud.timezone);
}

/**
 * Push current preferences to the user's profile. Debounced via the caller.
 */
export async function pushPreferences(userId: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;

  const { density, accent, reducedMotion, locale, timezone } = usePrefsStore.getState();
  await supabase
    .from("profiles")
    .update({
      preferences: { density, accent, reducedMotion, locale, timezone },
    } as never)
    .eq("id", userId);
}
