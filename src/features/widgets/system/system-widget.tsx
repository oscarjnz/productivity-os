"use client";

import { memo } from "react";
import { Cpu, HardDrive, Server, Activity } from "lucide-react";
import { useSystemStats, formatBytes, formatUptime } from "./use-system";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type { WidgetProps } from "@/types/widget.types";
import type { SystemConfig } from "./config";

interface MetricProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  bar?: { value: number; max: number };
}

function Metric({ label, value, icon, bar }: MetricProps) {
  const pct = bar ? Math.min(100, Math.max(0, (bar.value / bar.max) * 100)) : null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          {icon}
          {label}
        </span>
        <span className="text-[12px] tabular text-[var(--color-text-hi)]">{value}</span>
      </div>
      {pct !== null && (
        <div className="h-1 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className={cn(
              "h-full rounded-full",
              pct > 80
                ? "bg-[var(--color-danger)]"
                : pct > 60
                  ? "bg-[var(--color-warning)]"
                  : "bg-[var(--color-accent)]",
            )}
            style={{ width: `${pct}%`, transition: "width 0.32s var(--ease-standard)" }}
          />
        </div>
      )}
    </div>
  );
}

function SystemWidgetInner({ config }: WidgetProps<SystemConfig>) {
  const { data, isLoading, isError } = useSystemStats(config.pollSeconds);

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
        <div className="text-[12px] text-[var(--color-danger)]">System endpoint failed</div>
        <div className="text-[10.5px] text-[var(--color-text-lo)]">
          Check /api/system reachable.
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col gap-3">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    );
  }

  const memPctUsed = data.memory.systemFree > 0
    ? data.memory.systemTotal - data.memory.systemFree
    : data.memory.rss;
  const memMax = data.memory.systemTotal || (data.memory.rss * 2);

  return (
    <div className="flex h-full flex-col gap-3">
      <Metric
        label="Uptime"
        value={formatUptime(data.uptime)}
        icon={<Activity className="h-3 w-3" aria-hidden />}
      />
      <Metric
        label="Memory"
        value={`${formatBytes(memPctUsed)} / ${formatBytes(memMax)}`}
        icon={<HardDrive className="h-3 w-3" aria-hidden />}
        bar={{ value: memPctUsed, max: memMax }}
      />
      <Metric
        label="Load"
        value={data.cpu.loadAvg.map((n) => n.toFixed(2)).join(" · ")}
        icon={<Cpu className="h-3 w-3" aria-hidden />}
        bar={{ value: data.cpu.loadAvg[0] ?? 0, max: data.cpu.count }}
      />
      <div className="mt-auto flex flex-col gap-0.5 border-t border-[var(--color-border)] pt-2">
        <div className="flex items-center justify-between text-[10.5px] text-[var(--color-text-lo)]">
          <span className="inline-flex items-center gap-1">
            <Server className="h-3 w-3" aria-hidden />
            {data.host}
          </span>
          <span>{data.nodeVersion}</span>
        </div>
        <div className="text-[10px] text-[var(--color-text-lo)]">
          {data.platform} · {data.arch} · {data.cpu.count} CPU
        </div>
      </div>
    </div>
  );
}

export const SystemWidget = memo(SystemWidgetInner);
