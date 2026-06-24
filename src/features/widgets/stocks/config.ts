export interface StocksConfig {
  /** Ticker symbols, Yahoo-style (AAPL, TSLA, BTC-USD, ^GSPC, EURUSD=X). */
  symbols: string[];
  /** Optional Finnhub token for real-time quotes. Empty = keyless/delayed. */
  token?: string;
}

export const defaultStocksConfig: StocksConfig = {
  symbols: ["AAPL", "MSFT", "NVDA", "TSLA", "SPY"],
  token: "",
};
