import { Calendar } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { CalendarWidget } from "./calendar-widget";
import { CalendarSettings } from "./settings";
import { defaultCalendarConfig, type CalendarConfig } from "./config";

export const calendarWidget: WidgetDefinition<CalendarConfig> = {
  type: "calendar",
  name: "Calendar",
  description: "Upcoming Google Calendar events (read-only).",
  icon: Calendar,
  category: "productivity",
  defaultSize: { w: 5, h: 5 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 12, h: 12 },
  defaultConfig: defaultCalendarConfig,
  component: CalendarWidget,
  settings: CalendarSettings,
  requiresAuth: ["google"],
};

export type { CalendarConfig };
