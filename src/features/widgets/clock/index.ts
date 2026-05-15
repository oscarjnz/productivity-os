import { Clock } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { ClockWidget } from "./clock-widget";
import { ClockSettings } from "./settings";
import { defaultClockConfig, type ClockConfig } from "./config";

export const clockWidget: WidgetDefinition<ClockConfig> = {
  type: "clock",
  name: "Clock",
  description: "Local time with optional seconds and date.",
  icon: Clock,
  category: "personal",
  defaultSize: { w: 6, h: 2 },
  minSize: { w: 4, h: 2 },
  maxSize: { w: 12, h: 3 },
  defaultConfig: defaultClockConfig,
  component: ClockWidget,
  settings: ClockSettings,
};

export { ClockWidget } from "./clock-widget";
export { defaultClockConfig } from "./config";
export type { ClockConfig } from "./config";
