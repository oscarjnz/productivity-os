"use client";

import { memo } from "react";
import { Calendar as CalIcon, MapPin, ExternalLink } from "lucide-react";
import { useCalendarEvents } from "./use-calendar";
import {
  GoogleConnectGate,
  useGoogleServicesConnected,
} from "@/features/auth/google-connect-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type { WidgetProps } from "@/types/widget.types";
import type { CalendarConfig } from "./config";

function timeLabel(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function CalendarWidgetInner({ config }: WidgetProps<CalendarConfig>) {
  const connected = useGoogleServicesConnected();
  const { data, isLoading, isError, error } = useCalendarEvents(
    config.daysAhead,
    config.maxEvents,
    connected,
  );

  if (!connected) {
    return <GoogleConnectGate icon={<CalIcon className="h-6 w-6" aria-hidden />} label="Google Calendar" />;
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
        <div className="text-[12px] text-[var(--color-danger)]">
          {error instanceof Error ? error.message : "Calendar error"}
        </div>
        <div className="text-[10.5px] text-[var(--color-text-lo)]">
          Reconnect from the Gmail/Calendar widget if this persists.
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <CalIcon className="h-6 w-6 text-[var(--color-text-lo)]" aria-hidden />
        <div className="text-[12px] text-[var(--color-text-mid)]">Nothing scheduled</div>
        <div className="text-[10.5px] text-[var(--color-text-lo)]">Enjoy the open calendar.</div>
      </div>
    );
  }

  return (
    <ul className="-mr-1 flex h-full flex-col gap-1 overflow-y-auto pr-1">
      {data.map((e) => (
        <li
          key={e.id}
          className={cn(
            "group flex items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5",
            "border border-transparent",
            "transition-[border-color,background-color] duration-[var(--duration-fast)]",
            "hover:border-[var(--color-border)] hover:bg-[var(--color-bg-base)]",
          )}
        >
          <div className="w-12 shrink-0 pt-0.5 text-[10.5px] tabular text-[var(--color-text-lo)]">
            {e.allDay ? "all day" : timeLabel(e.start)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] text-[var(--color-text-hi)]">
              {e.summary}
            </div>
            {e.location && (
              <div className="flex items-center gap-1 truncate text-[10.5px] text-[var(--color-text-lo)]">
                <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden />
                {e.location}
              </div>
            )}
          </div>
          {e.htmlLink && (
            <a
              href={e.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in Google Calendar"
              className="text-[var(--color-text-lo)] opacity-0 transition-opacity hover:text-[var(--color-text-mid)] group-hover:opacity-100"
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export const CalendarWidget = memo(CalendarWidgetInner);
