import type { WidgetDefinition } from "@/types/widget.types";

/**
 * The registry is intentionally heterogeneous — every entry has a different
 * config shape. `WidgetDefinition<any>` is the correct boundary type here:
 * config typing is enforced *inside* each widget, not at the registry edge.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyWidgetDefinition = WidgetDefinition<any>;

/**
 * Lazy widget registry.
 * Each entry returns a Promise resolving to its WidgetDefinition.
 *
 * Adding a widget = adding one line here.
 */
export const widgetRegistry: Record<string, () => Promise<AnyWidgetDefinition>> = {
  clock: () => import("@/features/widgets/clock").then((m) => m.clockWidget),
  weather: () => import("@/features/widgets/weather").then((m) => m.weatherWidget),
  tasks: () => import("@/features/widgets/tasks").then((m) => m.tasksWidget),
  notes: () => import("@/features/widgets/notes").then((m) => m.notesWidget),
  bookmarks: () => import("@/features/widgets/bookmarks").then((m) => m.bookmarksWidget),
  github: () => import("@/features/widgets/github").then((m) => m.githubWidget),
  "ai-chat": () => import("@/features/widgets/ai-chat").then((m) => m.aiChatWidget),
  crypto: () => import("@/features/widgets/crypto").then((m) => m.cryptoWidget),
  system: () => import("@/features/widgets/system").then((m) => m.systemWidget),
  spotify: () => import("@/features/widgets/spotify").then((m) => m.spotifyWidget),
  calendar: () => import("@/features/widgets/calendar").then((m) => m.calendarWidget),
  gmail: () => import("@/features/widgets/gmail").then((m) => m.gmailWidget),
  sports: () => import("@/features/widgets/sports").then((m) => m.sportsWidget),
  currency: () => import("@/features/widgets/currency").then((m) => m.currencyWidget),
};

export type WidgetType = keyof typeof widgetRegistry;

export async function loadWidget(type: string): Promise<AnyWidgetDefinition | null> {
  const loader = widgetRegistry[type];
  if (!loader) return null;
  try {
    return await loader();
  } catch (err) {
    if (typeof console !== "undefined") {
      console.error(`[widget-registry] Failed to load "${type}":`, err);
    }
    return null;
  }
}

/**
 * Eagerly load all widget definitions.
 *
 * IMPORTANT: this is resilient by design — if a single widget module throws
 * on import (e.g. a syntax/type error, an icon name typo, a circular import),
 * we must NOT take the whole picker down with it. `Promise.allSettled` lets
 * the rest of the catalog still render and the failure is logged so the
 * broken widget can be tracked down without breaking the dashboard.
 *
 * Cache is only kept on full success — a partial result is not cached so a
 * later HMR or follow-up navigation can retry the failed module.
 */
let catalogCache: AnyWidgetDefinition[] | null = null;
let inflight: Promise<AnyWidgetDefinition[]> | null = null;

export function loadAllWidgets(): Promise<AnyWidgetDefinition[]> {
  if (catalogCache) return Promise.resolve(catalogCache);
  if (inflight) return inflight;

  const entries = Object.entries(widgetRegistry);
  inflight = Promise.allSettled(entries.map(([, loader]) => loader())).then(
    (results) => {
      const ok: AnyWidgetDefinition[] = [];
      let anyFailed = false;
      results.forEach((r, i) => {
        const [type] = entries[i]!;
        if (r.status === "fulfilled") {
          ok.push(r.value);
        } else {
          anyFailed = true;
          if (typeof console !== "undefined") {
            console.error(`[widget-registry] Skipping "${type}" — failed to load:`, r.reason);
          }
        }
      });
      // Only cache when every module succeeded; otherwise allow retry next call.
      if (!anyFailed) catalogCache = ok;
      inflight = null;
      return ok;
    },
  );
  return inflight;
}

/** Drop the in-memory catalog cache. Useful when a new widget gets registered at runtime. */
export function invalidateWidgetCatalog(): void {
  catalogCache = null;
  inflight = null;
}
