"use client";

import { useQuery } from "@tanstack/react-query";
import type { SystemStats } from "@/app/api/system/route";

export function useSystemStats(pollSeconds: number) {
  return useQuery<SystemStats>({
    queryKey: ["system-stats"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/system", { signal, cache: "no-store" });
      if (!res.ok) throw new Error(`System API ${res.status}`);
      return res.json() as Promise<SystemStats>;
    },
    refetchInterval: Math.max(2, pollSeconds) * 1000,
    staleTime: 0,
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

export function formatUptime(seconds: number): string {
  const s = Math.floor(seconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h || d) parts.push(`${h}h`);
  if (m || h || d) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(" ");
}
