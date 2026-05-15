export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatLongDate(d: Date): string {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatShortDate(d: Date): string {
  const day = DAYS[d.getDay()]?.slice(0, 3) ?? "";
  const mon = MONTHS[d.getMonth()]?.slice(0, 3) ?? "";
  return `${day}, ${mon} ${d.getDate()}`;
}

/**
 * Tight relative-time formatter — "just now", "5m", "3h", "2d", "4w", "Jul 12".
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const diffSec = (Date.now() - d.getTime()) / 1000;
  if (diffSec < 30) return "just now";
  if (diffSec < 60) return `${Math.floor(diffSec)}s`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 604_800) return `${Math.floor(diffSec / 86_400)}d`;
  if (diffSec < 2_592_000) return `${Math.floor(diffSec / 604_800)}w`;
  return formatShortDate(d);
}
