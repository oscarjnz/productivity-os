export interface CalendarConfig {
  /** How many days ahead to include (1 = today only). */
  daysAhead: number;
  maxEvents: number;
}

export const defaultCalendarConfig: CalendarConfig = {
  daysAhead: 1,
  maxEvents: 10,
};
