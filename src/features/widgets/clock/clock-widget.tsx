"use client";

import { memo, useMemo } from "react";
import { useCurrentTime } from "@/lib/hooks/use-current-time";
import { pad2, formatLongDate } from "@/lib/utils/format";
import { usePrefsStore } from "@/stores/prefs.store";
import { cn } from "@/lib/utils/cn";
import type { WidgetProps } from "@/types/widget.types";
import type { ClockConfig } from "./config";

interface TimeSegments {
  hh: string;
  mm: string;
  ss: string;
  meridiem: "AM" | "PM" | null;
}

const PLACEHOLDER: TimeSegments = { hh: "--", mm: "--", ss: "--", meridiem: null };

function segmentsFor(now: Date, config: ClockConfig, fallbackTz: string | null): TimeSegments {
  const tz = config.timezone || fallbackTz || undefined;
  const parts = new Intl.DateTimeFormat("en-US", {
    hour12: config.format === "12h",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: tz,
  }).formatToParts(now);

  const map = new Map(parts.map((p) => [p.type, p.value]));
  const meridiem = (map.get("dayPeriod") ?? "").toUpperCase();

  return {
    hh: pad2(Number(map.get("hour") ?? "00")),
    mm: pad2(Number(map.get("minute") ?? "00")),
    ss: pad2(Number(map.get("second") ?? "00")),
    meridiem: config.format === "12h" ? (meridiem === "PM" ? "PM" : "AM") : null,
  };
}

function ClockWidgetInner({ config }: WidgetProps<ClockConfig>) {
  const now = useCurrentTime(1000);
  const globalTz = usePrefsStore((s) => s.timezone);
  const seg = useMemo(
    () => (now ? segmentsFor(now, config, globalTz) : PLACEHOLDER),
    [now, config, globalTz],
  );
  const dateLabel = useMemo(() => (now ? formatLongDate(now) : ""), [now]);

  return (
    <div className="flex h-full flex-col justify-center">
      <div
        className={cn(
          "tabular leading-none",
          "text-[var(--color-text-hi)]",
          "text-[clamp(2.25rem,7vw,3.75rem)] font-light tracking-[-0.04em]",
        )}
        role="timer"
        aria-live="polite"
        aria-atomic="true"
      >
        <span>{seg.hh}</span>
        <span className="inline-block animate-[blink_1s_step-end_infinite] text-[var(--color-text-lo)]">
          :
        </span>
        <span>{seg.mm}</span>
        {config.showSeconds && (
          <span className="ml-1 text-[0.62em] text-[var(--color-text-lo)]">
            <span className="inline-block animate-[blink_1s_step-end_infinite]">:</span>
            {seg.ss}
          </span>
        )}
        {seg.meridiem && (
          <span className="ml-2 text-[0.32em] uppercase tracking-[0.16em] text-[var(--color-text-mid)]">
            {seg.meridiem}
          </span>
        )}
      </div>

      {config.showDate && (
        <div className="mt-2 text-[13px] text-[var(--color-text-mid)]">{dateLabel}</div>
      )}
    </div>
  );
}

export const ClockWidget = memo(ClockWidgetInner);
