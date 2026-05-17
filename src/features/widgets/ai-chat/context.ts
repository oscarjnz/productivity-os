"use client";

import { getDb } from "@/lib/db/dexie";
import { useLayoutStore } from "@/stores/layout.store";
import { formatBytes, formatUptime } from "@/features/widgets/system/use-system";
import type { SystemStats } from "@/app/api/system/route";

/**
 * Phase 1 dashboard context gatherer.
 *
 * Pulls ONLY data that is reliably available client-side with no extra auth:
 *   - date/time
 *   - tasks, notes, bookmarks (Dexie, local-first, instant)
 *   - active widgets (layout store)
 *   - system stats (one cheap /api/system call, best-effort)
 *
 * NOT included yet (Phase 2): calendar, gmail, crypto, weather, spotify.
 * The system prompt is written to say "no disponible" for anything missing,
 * so a section being absent here must NEVER cause the model to invent it.
 *
 * Caps everything so the prompt stays bounded regardless of dataset size.
 */

const CAP = { tasks: 40, notes: 25, bookmarks: 40, noteChars: 140 } as const;

async function fetchSystem(): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch("/api/system", { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (!res.ok) return null;
    const s = (await res.json()) as SystemStats;
    const usedMem = s.memory.systemTotal - s.memory.systemFree;
    return [
      `uptime proceso ${formatUptime(s.uptime)}`,
      `RAM usada ${formatBytes(usedMem)} de ${formatBytes(s.memory.systemTotal)}`,
      `carga ${s.cpu.loadAvg.map((n) => n.toFixed(2)).join(" / ")} (${s.cpu.count} CPU)`,
      `host ${s.host}`,
    ].join(" · ");
  } catch {
    return null;
  }
}

export async function buildDashboardContext(): Promise<string> {
  const db = getDb();
  const lines: string[] = [];

  const now = new Date();
  lines.push(
    `FECHA/HORA: ${now.toLocaleString("es-DO", { dateStyle: "full", timeStyle: "short" })}`,
  );

  if (db) {
    const [tasks, notes, bookmarks] = await Promise.all([
      db.tasks.toArray(),
      db.notes.toArray(),
      db.bookmarks.toArray(),
    ]);

    const pending = tasks.filter((t) => !t.completed);
    const done = tasks.filter((t) => t.completed);
    if (tasks.length > 0) {
      const shown = pending.slice(0, CAP.tasks);
      lines.push(
        `TAREAS (${pending.length} pendientes, ${done.length} completadas):`,
      );
      for (const t of shown) lines.push(`- [ ] ${t.content}`);
      if (pending.length > shown.length)
        lines.push(`- (+${pending.length - shown.length} pendientes más)`);
    } else {
      lines.push("TAREAS: ninguna");
    }

    if (notes.length > 0) {
      lines.push(`NOTAS (${notes.length}):`);
      for (const n of notes.slice(0, CAP.notes)) {
        const txt = n.content.replace(/\s+/g, " ").trim().slice(0, CAP.noteChars);
        lines.push(`- ${txt || "(vacía)"}`);
      }
      if (notes.length > CAP.notes)
        lines.push(`- (+${notes.length - CAP.notes} notas más)`);
    } else {
      lines.push("NOTAS: ninguna");
    }

    if (bookmarks.length > 0) {
      lines.push(`MARCADORES (${bookmarks.length}):`);
      for (const b of bookmarks.slice(0, CAP.bookmarks)) {
        lines.push(`- ${b.label} — ${b.url}`);
      }
      if (bookmarks.length > CAP.bookmarks)
        lines.push(`- (+${bookmarks.length - CAP.bookmarks} más)`);
    } else {
      lines.push("MARCADORES: ninguno");
    }
  }

  // Active widgets from the layout store (vanilla access — no React needed).
  try {
    const { order, instances } = useLayoutStore.getState();
    const counts = new Map<string, number>();
    for (const id of order) {
      const t = instances[id]?.type;
      if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    if (counts.size > 0) {
      const list = Array.from(counts.entries())
        .map(([t, c]) => (c > 1 ? `${t} x${c}` : t))
        .join(", ");
      lines.push(`WIDGETS ACTIVOS: ${list}`);
    }
  } catch {
    /* layout store not ready — skip */
  }

  const sys = await fetchSystem();
  if (sys) lines.push(`SISTEMA: ${sys}`);

  return [
    "=== CONTEXTO DEL DASHBOARD (datos reales del usuario) ===",
    ...lines,
    "=== FIN DEL CONTEXTO ===",
  ].join("\n");
}
