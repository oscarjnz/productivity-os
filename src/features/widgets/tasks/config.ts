export type TaskFilter = "all" | "pending" | "done";

export interface TasksConfig {
  filter: TaskFilter;
  /** @deprecated kept for back-compat with v1 widgets */
  showCompleted?: boolean;
}

export const defaultTasksConfig: TasksConfig = {
  filter: "all",
};

/**
 * Reads an effective filter from a (possibly legacy) config.
 * Old `showCompleted: false` maps to `pending`; `true` maps to `all`.
 */
export function resolveFilter(config: TasksConfig): TaskFilter {
  if (config.filter) return config.filter;
  return config.showCompleted === false ? "pending" : "all";
}
