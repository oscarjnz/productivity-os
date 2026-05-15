"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";

export interface ProfileRecord {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    setLoading(true);
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, username")
      .eq("id", user.id)
      .single()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        if (data) setProfile(data);
        setLoading(false);
      });
  }, [user]);

  const update = useCallback(
    async (patch: Partial<Pick<ProfileRecord, "display_name" | "avatar_url" | "username">>) => {
      if (!user) return;
      const supabase = getSupabaseBrowser();
      if (!supabase) return;
      setError(null);
      const { error: err } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id);
      if (err) {
        setError(err.message);
        return;
      }
      setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    },
    [user],
  );

  return { profile, loading, error, update };
}
