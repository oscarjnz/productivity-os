"use client";

import { useQuery } from "@tanstack/react-query";
import { getValidGoogleToken } from "@/features/auth/google-services";

export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location: string | null;
  htmlLink: string | null;
}

interface GCalResponse {
  items?: Array<{
    id: string;
    summary?: string;
    location?: string;
    htmlLink?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
  }>;
}

export function useCalendarEvents(daysAhead: number, maxEvents: number, enabled: boolean) {
  return useQuery<CalendarEvent[]>({
    queryKey: ["gcal", daysAhead, maxEvents],
    enabled,
    queryFn: async ({ signal }) => {
      const token = await getValidGoogleToken();
      if (!token) throw new Error("Not connected");

      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const end = new Date();
      end.setDate(end.getDate() + Math.max(1, daysAhead));
      end.setHours(23, 59, 59, 999);

      const params = new URLSearchParams({
        timeMin,
        timeMax: end.toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: String(Math.min(50, maxEvents)),
      });

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
        { signal, headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.status === 401 || res.status === 403) throw new Error("Google session expired");
      if (!res.ok) throw new Error(`Calendar ${res.status}`);

      const data = (await res.json()) as GCalResponse;
      return (data.items ?? []).map((e) => {
        const allDay = !e.start.dateTime;
        return {
          id: e.id,
          summary: e.summary ?? "(no title)",
          start: new Date(e.start.dateTime ?? `${e.start.date}T00:00:00`),
          end: new Date(e.end.dateTime ?? `${e.end.date}T00:00:00`),
          allDay,
          location: e.location ?? null,
          htmlLink: e.htmlLink ?? null,
        };
      });
    },
    refetchInterval: 5 * 60_000,
    staleTime: 2 * 60_000,
  });
}
