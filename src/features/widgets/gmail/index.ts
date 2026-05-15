import { Mail } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { GmailWidget } from "./gmail-widget";
import { GmailSettings } from "./settings";
import { defaultGmailConfig, type GmailConfig } from "./config";

export const gmailWidget: WidgetDefinition<GmailConfig> = {
  type: "gmail",
  name: "Gmail",
  description: "Unread inbox preview (read-only).",
  icon: Mail,
  category: "productivity",
  defaultSize: { w: 5, h: 5 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 12, h: 12 },
  defaultConfig: defaultGmailConfig,
  component: GmailWidget,
  settings: GmailSettings,
  requiresAuth: ["google"],
};

export type { GmailConfig };
