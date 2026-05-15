import type { WidgetPosition, WidgetSize } from "@/types/widget.types";

export interface GridConfig {
  cols: number;
  rowHeight: number; // px per row
  gap: number; // px
}

export const DEFAULT_GRID: GridConfig = {
  cols: 12,
  rowHeight: 80,
  gap: 12,
};

export interface GridGeometry extends GridConfig {
  /** Pixel width of one column (computed from container width). */
  cellWidth: number;
  containerWidth: number;
}

export interface PlacedRect extends WidgetPosition, WidgetSize {
  id: string;
}
