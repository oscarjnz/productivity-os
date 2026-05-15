import { Bookmark } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { BookmarksWidget } from "./bookmarks-widget";
import { BookmarksSettings } from "./settings";
import { defaultBookmarksConfig, type BookmarksConfig } from "./config";

export const bookmarksWidget: WidgetDefinition<BookmarksConfig> = {
  type: "bookmarks",
  name: "Bookmarks",
  description: "Favicon tiles with optional emoji icons.",
  icon: Bookmark,
  category: "productivity",
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  maxSize: { w: 12, h: 8 },
  defaultConfig: defaultBookmarksConfig,
  component: BookmarksWidget,
  settings: BookmarksSettings,
};

export type { BookmarksConfig };
export { defaultBookmarksConfig };
