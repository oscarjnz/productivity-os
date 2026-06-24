/** Shared time/day formatting for sports rows so every variant labels a
 *  match's day identically. */

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Relative day label (Spanish, matches the rest of the sports UI) so the user
 *  can always tell a scheduled match's day apart in the mixed "Todos" view.
 *  Data range is ~7 days, so a weekday abbreviation suffices beyond hoy/mañana. */
export function relativeDay(iso: string): { label: string; today: boolean } {
  const diff = Math.round(
    (startOfDay(new Date(iso)) - startOfDay(new Date())) / 86_400_000,
  );
  if (diff === 0) return { label: "HOY", today: true };
  if (diff === 1) return { label: "MAÑ", today: false };
  if (diff === -1) return { label: "AYER", today: false };
  const wd = new Date(iso)
    .toLocaleDateString("es", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
  return { label: wd, today: false };
}
