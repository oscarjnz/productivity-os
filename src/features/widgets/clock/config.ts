export interface ClockConfig {
  /** "24h" or "12h" display. */
  format: "24h" | "12h";
  /** Show seconds segment. */
  showSeconds: boolean;
  /** Show long date row beneath the time. */
  showDate: boolean;
  /** Time zone IANA name. Empty = browser default. */
  timezone: string;
}

export const defaultClockConfig: ClockConfig = {
  format: "24h",
  showSeconds: true,
  showDate: true,
  timezone: "",
};
