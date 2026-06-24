import { LineChart } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { StocksWidget } from "./stocks-widget";
import { StocksSettings } from "./settings";
import { defaultStocksConfig, type StocksConfig } from "./config";

export const stocksWidget: WidgetDefinition<StocksConfig> = {
  type: "stocks",
  name: "Stocks",
  description: "Watchlist with live prices — keyless, optional real-time key.",
  icon: LineChart,
  category: "personal",
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 8, h: 10 },
  defaultConfig: defaultStocksConfig,
  component: StocksWidget,
  settings: StocksSettings,
};

export type { StocksConfig };
