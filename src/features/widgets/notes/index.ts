import { StickyNote } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { NotesWidget } from "./notes-widget";
import { NotesSettings } from "./settings";
import { defaultNotesConfig, type NotesConfig } from "./config";

export const notesWidget: WidgetDefinition<NotesConfig> = {
  type: "notes",
  name: "Notes",
  description: "Sticky notes with autosave and cloud sync.",
  icon: StickyNote,
  category: "productivity",
  defaultSize: { w: 5, h: 4 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 12, h: 10 },
  defaultConfig: defaultNotesConfig,
  component: NotesWidget,
  settings: NotesSettings,
};

export type { NotesConfig };
export { defaultNotesConfig };
