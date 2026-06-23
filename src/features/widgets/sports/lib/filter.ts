import type { SportsView } from "../config";
import type { SportsEvent } from "../types";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function applyViewFilter(events: SportsEvent[], view: SportsView): SportsEvent[] {
  if (view === "all") return events;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return events.filter((ev) => {
    if (view === "live") return ev.status === "live";
    const d = new Date(ev.startsAt);
    if (view === "today") return isSameDay(d, now);
    if (view === "tomorrow") return isSameDay(d, tomorrow);
    return true;
  });
}
