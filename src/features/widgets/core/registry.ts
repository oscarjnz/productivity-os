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
  } catch {
    return null;
  }
}

/**
 * Eagerly load *all* widget definitions. Used by the picker and palette
 * to display the full catalog. Cached on first call.
 */
let catalogCache: Promise<AnyWidgetDefinition[]> | null = null;
export function loadAllWidgets(): Promise<AnyWidgetDefinition[]> {
  if (!catalogCache) {
    catalogCache = Promise.all(
      Object.values(widgetRegistry).map((loader) => loader()),
    );
  }
  return catalogCache;
}
