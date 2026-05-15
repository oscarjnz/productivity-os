export type CryptoCurrency = "usd" | "eur" | "btc";

export interface CryptoConfig {
  /** CoinGecko coin IDs — e.g. "bitcoin", "ethereum", "solana". */
  coins: string[];
  currency: CryptoCurrency;
}

export const defaultCryptoConfig: CryptoConfig = {
  coins: ["bitcoin", "ethereum", "solana"],
  currency: "usd",
};

export const CURRENCY_SYMBOL: Record<CryptoCurrency, string> = {
  usd: "$",
  eur: "€",
  btc: "₿",
};
