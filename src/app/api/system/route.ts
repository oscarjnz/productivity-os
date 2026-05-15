import { NextResponse } from "next/server";
import os from "node:os";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface SystemStats {
  uptime: number;        // seconds since process start
  systemUptime: number;  // seconds since OS boot
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    systemTotal: number;
    systemFree: number;
  };
  cpu: {
    count: number;
    model: string;
    loadAvg: [number, number, number];
  };
  host: string;
  platform: string;
  nodeVersion: string;
  arch: string;
  ts: number;
}

export async function GET() {
  const mem = process.memoryUsage();
  const stats: SystemStats = {
    uptime: process.uptime(),
    systemUptime: os.uptime(),
    memory: {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
      systemTotal: os.totalmem(),
      systemFree: os.freemem(),
    },
    cpu: {
      count: os.cpus().length,
      model: os.cpus()[0]?.model.trim() ?? "unknown",
      loadAvg: os.loadavg() as [number, number, number],
    },
    host: os.hostname(),
    platform: `${os.platform()} ${os.release()}`,
    nodeVersion: process.version,
    arch: os.arch(),
    ts: Date.now(),
  };

  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
