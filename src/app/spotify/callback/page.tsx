"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { completeSpotifyAuth } from "@/features/widgets/spotify/oauth";
import { cn } from "@/lib/utils/cn";

// Depends on query params — never prerender.
export const dynamic = "force-dynamic";

type Status = "exchanging" | "ok" | "error";

function SpotifyCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>("exchanging");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const err = params.get("error");

    if (err) {
      setStatus("error");
      setError(err);
      return;
    }
    if (!code || !state) {
      setStatus("error");
      setError("Missing code or state");
      return;
    }

    completeSpotifyAuth(code, state)
      .then(() => {
        setStatus("ok");
        setTimeout(() => router.replace("/"), 600);
      })
      .catch((e: unknown) => {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Token exchange failed");
      });
  }, [params, router]);

  return (
    <div className="ambient-bg flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="flex w-full max-w-[360px] flex-col items-center gap-4 rounded-[var(--radius-lg)] glass-hi p-6 text-center shadow-[var(--shadow-md)]">
        {status === "exchanging" && (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" aria-hidden />
            <div className="text-[13px] text-[var(--color-text-hi)]">Connecting to Spotify…</div>
          </>
        )}
        {status === "ok" && (
          <>
            <Check className="h-6 w-6 text-[var(--color-success)]" aria-hidden />
            <div className="text-[13px] text-[var(--color-text-hi)]">Connected. Redirecting…</div>
          </>
        )}
        {status === "error" && (
          <>
            <AlertTriangle className="h-6 w-6 text-[var(--color-danger)]" aria-hidden />
            <div className="text-[13px] text-[var(--color-text-hi)]">Connection failed</div>
            <div className="text-[11.5px] text-[var(--color-text-lo)]">{error}</div>
            <button
              type="button"
              onClick={() => router.replace("/")}
              className={cn(
                "rounded-[var(--radius-sm)] px-3 py-1.5",
                "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
                "border border-[oklch(0.68_0.18_270/0.2)]",
                "text-[12px]",
              )}
            >
              Back to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SpotifyCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="ambient-bg flex min-h-dvh items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" aria-hidden />
        </div>
      }
    >
      <SpotifyCallbackInner />
    </Suspense>
  );
}
