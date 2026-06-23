export type CurrencyCode =
  | "USD"
  | "EUR"
  | "DOP"
  | "MXN"
  | "BRL"
  | "ARS"
  | "COP"
  | "CLP"
  | "GBP"
  | "JPY"
  | "CNY"
  | "CAD"
  | "CHF";

export interface CurrencyPair {
  from: CurrencyCode;
  to: CurrencyCode;
}

export interface CurrencyConfig {
  /** Source currency for the converter. */
  base: CurrencyCode;
  /** Quick-quote pairs displayed below the converter. */
  pairs: CurrencyPair[];
  /** Default amount in the converter input. */
  amount: number;
}

export const defaultCurrencyConfig: CurrencyConfig = {
  base: "USD",
  amount: 100,
  pairs: [
    { from: "USD", to: "DOP" },
    { from: "EUR", to: "DOP" },
    { from: "USD", to: "EUR" },
  ],
};

export const CURRENCY_META: Record<CurrencyCode, { symbol: string; flag: string; name: string }> = {
  USD: { symbol: "$", flag: "🇺🇸", name: "US Dollar" },
  EUR: { symbol: "€", flag: "🇪🇺", name: "Euro" },
  DOP: { symbol: "RD$", flag: "🇩🇴", name: "Peso dominicano" },
  MXN: { symbol: "$", flag: "🇲🇽", name: "Peso mexicano" },
  BRL: { symbol: "R$", flag: "🇧🇷", name: "Real brasileño" },
  ARS: { symbol: "$", flag: "🇦🇷", name: "Peso argentino" },
  COP: { symbol: "$", flag: "🇨🇴", name: "Peso colombiano" },
  CLP: { symbol: "$", flag: "🇨🇱", name: "Peso chileno" },
  GBP: { symbol: "£", flag: "🇬🇧", name: "Libra esterlina" },
  JPY: { symbol: "¥", flag: "🇯🇵", name: "Yen japonés" },
  CNY: { symbol: "¥", flag: "🇨🇳", name: "Yuan chino" },
  CAD: { symbol: "$", flag: "🇨🇦", name: "Dólar canadiense" },
  CHF: { symbol: "CHF", flag: "🇨🇭", name: "Franco suizo" },
};

export const ALL_CURRENCIES: CurrencyCode[] = Object.keys(CURRENCY_META) as CurrencyCode[];
