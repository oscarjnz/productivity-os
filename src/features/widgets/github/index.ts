import { Github } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { GitHubWidget } from "./github-widget";
import { GitHubSettings } from "./settings";
import { defaultGitHubConfig, type GitHubConfig } from "./config";

export const githubWidget: WidgetDefinition<GitHubConfig> = {
  type: "github",
  name: "GitHub Activity",
  description: "Recent public events for any GitHub user.",
  icon: Github,
  category: "developer",
  defaultSize: { w: 5, h: 4 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 12, h: 10 },
  defaultConfig: defaultGitHubConfig,
  component: GitHubWidget,
  settings: GitHubSettings,
};

export type { GitHubConfig };
