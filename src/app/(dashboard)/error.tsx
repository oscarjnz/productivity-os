"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Segment-level boundary for the dashboard. A crash in the shell, a provider,
 * or anything outside an individual widget lands here instead of a white page.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[dashboard:error]", error);
  }, [error]);

  return (
    <div className="ambient-bg flex min-h-dvh flex-col items-center justify-center px-5">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-4 rounded-[var(--radius-lg)] glass-hi p-7 text-center shadow-[var(--shadow-md)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-hi)]">
            The dashboard hit an error
          </h2>
          <p className="text-[12px] text-[var(--color-text-lo)]">
            Your data is safe — it lives in IndexedDB and the cloud. This is a
            render-side fault.
          </p>
          {error.message && (
            <code className="mt-1 break-words text-[11px] text-[var(--color-text-lo)]">
              {error.message.slice(0, 180)}
            </code>
          )}
        </div>
        <button
          type="button"
          onClick={reset}
          className={cn(
            "inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3.5 py-2",
            "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
            "border border-[oklch(0.68_0.18_270/0.2)] text-[12.5px] font-medium",
            "transition-[background-color] duration-[var(--duration-fast)]",
            "hover:bg-[oklch(0.68_0.18_270/0.18)] active:scale-[0.98]",
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Try again
        </button>
      </div>
    </div>
  );
}
