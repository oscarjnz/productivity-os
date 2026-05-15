import { Server } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { SystemWidget } from "./system-widget";
import { SystemSettings } from "./settings";
import { defaultSystemConfig, type SystemConfig } from "./config";

export const systemWidget: WidgetDefinition<SystemConfig> = {
  type: "system",
  name: "System",
  description: "VPS uptime, memory and load. Polls /api/system.",
  icon: Server,
  category: "system",
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 8, h: 6 },
  defaultConfig: defaultSystemConfig,
  component: SystemWidget,
  settings: SystemSettings,
};

export type { SystemConfig };
