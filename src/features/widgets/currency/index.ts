import { Banknote } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { CurrencyWidget } from "./currency-widget";
import { CurrencySettings } from "./settings";
import { defaultCurrencyConfig, type CurrencyConfig } from "./config";

export const currencyWidget: WidgetDefinition<CurrencyConfig> = {
  type: "currency",
  name: "Currency",
  description: "Conversor de monedas en vivo — DOP, USD, EUR y más. Sin keys.",
  icon: Banknote,
  category: "personal",
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 6, h: 8 },
  defaultConfig: defaultCurrencyConfig,
  component: CurrencyWidget,
  settings: CurrencySettings,
};

export type { CurrencyConfig };
