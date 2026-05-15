import type { WidgetDefinition } from "@/types/widget.types";

/**
 * Lazy widget registry.
 * Each entry returns a Promise resolving to its WidgetDefinition.
 *
 * Adding a widget = adding one line here.
 */
export const widgetRegistry: Record<string, () => Promise<WidgetDefinition>> = {
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
};

export type WidgetType = keyof typeof widgetRegistry;

export async function loadWidget(type: string): Promise<WidgetDefinition | null> {
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
let catalogCache: Promise<WidgetDefinition[]> | null = null;
export function loadAllWidgets(): Promise<WidgetDefinition[]> {
  if (!catalogCache) {
    catalogCache = Promise.all(
      Object.values(widgetRegistry).map((loader) => loader()),
    );
  }
  return catalogCache;
}
