import { Sparkles } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { AIChatWidget } from "./ai-chat-widget";
import { AIChatSettings } from "./settings";
import { defaultAIChatConfig, type AIChatConfig } from "./config";

export const aiChatWidget: WidgetDefinition<AIChatConfig> = {
  type: "ai-chat",
  name: "AI Chat",
  description: "BYOK Claude chat — key stays local, no server.",
  icon: Sparkles,
  category: "personal",
  defaultSize: { w: 5, h: 6 },
  minSize: { w: 4, h: 4 },
  maxSize: { w: 12, h: 12 },
  defaultConfig: defaultAIChatConfig,
  component: AIChatWidget,
  settings: AIChatSettings,
};

export type { AIChatConfig };
