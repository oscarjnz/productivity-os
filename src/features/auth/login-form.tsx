"use client";

import { useState } from "react";
import { Mail, Github, ArrowRight, Check } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnv } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type LoginState = "idle" | "loading" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<LoginState>("idle");
  const [error, setError] = useState<string | null>(null);

  if (!supabaseEnv.isConfigured) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="text-[13px] text-[var(--color-text-mid)]">
          Supabase isn&apos;t configured yet.
        </div>
        <div className="text-[11.5px] text-[var(--color-text-lo)]">
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>.
          The dashboard works locally without auth — your data is saved in
          IndexedDB.
        </div>
      </div>
    );
  }

  const handleOAuth = async (provider: "google" | "github"): Promise<void> => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setState("loading");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) {
      setError(err.message);
      setState("error");
    }
  };

  const handleMagicLink = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const supabase = getSupabaseBrowser();
    if (!supabase || !email) return;
    setState("loading");
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) {
      setError(err.message);
      setState("error");
    } else {
      setState("sent");
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        variant="secondary"
        size="lg"
        onClick={() => handleOAuth("google")}
        disabled={state === "loading"}
        className="w-full justify-center gap-2.5"
      >
        <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-11.3 8 12 12 0 1 1 7.6-21.3l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.9z"/>
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3a12 12 0 0 1-7.3 2.5 12 12 0 0 1-11.3-8L6.2 33A20 20 0 0 0 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12.1 12.1 0 0 1-4.1 5.5l6.2 5.3A19.4 19.4 0 0 0 44 24c0-1.3-.1-2.6-.4-3.9z"/>
        </svg>
        Continue with Google
      </Button>

      <Button
        variant="secondary"
        size="lg"
        onClick={() => handleOAuth("github")}
        disabled={state === "loading"}
        className="w-full justify-center gap-2.5"
      >
        <Github className="h-4 w-4" aria-hidden />
        Continue with GitHub
      </Button>

      <div className="my-1 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          or
        </span>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <form onSubmit={handleMagicLink} className="flex flex-col gap-2.5">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-lo)]" aria-hidden />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={state === "loading" || state === "sent"}
            className={cn(
              "w-full rounded-[var(--radius-md)] bg-[var(--color-bg-raised)]",
              "border border-[var(--color-border)] px-9 py-2.5",
              "text-[13px] text-[var(--color-text-hi)] outline-none",
              "placeholder:text-[var(--color-text-lo)]",
              "focus:border-[var(--color-accent)]",
              "transition-colors duration-[var(--duration-fast)]",
              "disabled:opacity-60",
            )}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={state === "loading" || state === "sent" || !email}
          className="w-full justify-center gap-1.5"
        >
          {state === "sent" ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden />
              Magic link sent
            </>
          ) : (
            <>
              Send magic link
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </>
          )}
        </Button>
      </form>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-2 text-[12px] text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {state === "sent" && (
        <div className="text-center text-[11.5px] text-[var(--color-text-lo)]">
          Check your inbox — the link expires in 10 minutes.
        </div>
      )}
    </div>
  );
}
