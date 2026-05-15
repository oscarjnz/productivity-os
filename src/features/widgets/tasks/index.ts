import { ListTodo } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { TasksWidget } from "./tasks-widget";
import { TasksSettings } from "./settings";
import { defaultTasksConfig, type TasksConfig } from "./config";

export const tasksWidget: WidgetDefinition<TasksConfig> = {
  type: "tasks",
  name: "Tasks",
  description: "Lightweight to-do list with real-time sync.",
  icon: ListTodo,
  category: "productivity",
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 8, h: 10 },
  defaultConfig: defaultTasksConfig,
  component: TasksWidget,
  settings: TasksSettings,
};

export type { TasksConfig };
export { defaultTasksConfig };
