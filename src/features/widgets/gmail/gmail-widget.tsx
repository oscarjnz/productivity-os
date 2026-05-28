"use client";

import { memo } from "react";
import { Mail, ExternalLink } from "lucide-react";
import { useGmail } from "./use-gmail";
import {
  GoogleConnectGate,
  useGoogleServicesConnected,
} from "@/features/auth/google-connect-gate";
import { formatRelativeTime } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type { WidgetProps } from "@/types/widget.types";
import type { GmailConfig } from "./config";

function GmailWidgetInner({ config }: WidgetProps<GmailConfig>) {
  const connected = useGoogleServicesConnected();
  const { data, isLoading, isError, error } = useGmail(
    config.query,
    config.maxThreads,
    connected,
  );

  if (!connected) {
    return <GoogleConnectGate icon={<Mail className="h-6 w-6" aria-hidden />} label="Gmail" />;
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
        <div className="text-[12px] text-[var(--color-danger)]">
          {error instanceof Error ? error.message : "Gmail error"}
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-mid)]">
          <Mail className="h-3 w-3" aria-hidden />
          {data.unreadCount} unread
        </span>
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10.5px] text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]"
        >
          Open
          <ExternalLink className="h-2.5 w-2.5" aria-hidden />
        </a>
      </div>

      {data.messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Mail className="h-6 w-6 text-[var(--color-text-lo)]" aria-hidden />
          <div className="text-[12px] text-[var(--color-text-mid)]">Inbox zero</div>
          <div className="text-[10.5px] text-[var(--color-text-lo)]">
            No threads match your query.
          </div>
        </div>
      ) : (
        <ul className="-mr-1 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {data.messages.map((m) => (
            <li
              key={m.id}
              className={cn(
                "flex flex-col gap-0.5 rounded-[var(--radius-sm)] px-2 py-1.5",
                "border border-transparent",
                "transition-[border-color,background-color] duration-[var(--duration-fast)]",
                "hover:border-[var(--color-border)] hover:bg-[var(--color-bg-base)]",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[11.5px] font-medium text-[var(--color-text-hi)]">
                  {m.from}
                </span>
                <span className="shrink-0 text-[10px] tabular text-[var(--color-text-lo)]">
                  {formatRelativeTime(m.date)}
                </span>
              </div>
              <span className="truncate text-[12px] text-[var(--color-text-mid)]">
                {m.subject}
              </span>
              <span className="truncate text-[10.5px] text-[var(--color-text-lo)]">
                {m.snippet}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const GmailWidget = memo(GmailWidgetInner);
