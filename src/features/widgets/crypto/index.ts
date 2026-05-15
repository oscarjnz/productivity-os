import { Coins } from "lucide-react";
import type { WidgetDefinition } from "@/types/widget.types";
import { CryptoWidget } from "./crypto-widget";
import { CryptoSettings } from "./settings";
import { defaultCryptoConfig, type CryptoConfig } from "./config";

export const cryptoWidget: WidgetDefinition<CryptoConfig> = {
  type: "crypto",
  name: "Crypto",
  description: "Live prices from CoinGecko — no key required.",
  icon: Coins,
  category: "personal",
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 8, h: 10 },
  defaultConfig: defaultCryptoConfig,
  component: CryptoWidget,
  settings: CryptoSettings,
};

export type { CryptoConfig };
