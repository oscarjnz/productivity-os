import type { ComponentType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Grid-relative dimensions. 1 unit = 1 grid cell. */
export interface WidgetSize {
  w: number;
  h: number;
}

/** Grid-relative position. Origin top-left. */
export interface WidgetPosition {
  x: number;
  y: number;
}

export type WidgetCategory =
  | "productivity"
  | "media"
  | "system"
  | "developer"
  | "personal";

export type OAuthProvider = "google" | "github" | "spotify";

/**
 * Static metadata + component for a widget *type*.
 * Lives in the registry. One per implementation.
 */
export interface WidgetSettingsProps<TConfig> {
  config: TConfig;
  onChange: (next: TConfig) => void;
}

export interface WidgetDefinition<TConfig = Record<string, unknown>> {
  type: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: WidgetCategory;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize?: WidgetSize;
  defaultConfig: TConfig;
  component: ComponentType<WidgetProps<TConfig>>;
  /** Optional settings panel rendered in a popover triggered by the ⚙ button. */
  settings?: ComponentType<WidgetSettingsProps<TConfig>>;
  requiresAuth?: OAuthProvider[];
  supportsRealtime?: boolean;
}

/**
 * Runtime data for a placed widget *instance*.
 * One row per placed widget in DB / IndexedDB.
 */
export interface WidgetInstance<TConfig = Record<string, unknown>> {
  id: string;
  type: string;
  dashboardId: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: TConfig;
  zOrder: number;
}

export interface WidgetProps<TConfig = Record<string, unknown>> {
  instanceId: string;
  config: TConfig;
  size: WidgetSize;
  isEditing: boolean;
  onConfigChange: (next: TConfig) => void;
}

export interface WidgetShellSlots {
  title?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}
