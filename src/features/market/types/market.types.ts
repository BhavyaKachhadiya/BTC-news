export interface MarketData {
  readonly price: number;
  readonly change24h: number;
  readonly volume24h: number;
  readonly marketCap: number;
  readonly high24h?: number;
  readonly low24h?: number;
  readonly timestamp: string;
  readonly provider: "coingecko";
}

export interface HistoricalPriceParams {
  readonly days?: number;
  readonly interval?: "daily" | "hourly";
}

export interface HistoricalDataPoint {
  readonly timestamp: number;
  readonly price: number;
}

export interface MarketDataProvider {
  getCurrentMarketData(): Promise<MarketData>;
  getHistoricalPrices(params?: HistoricalPriceParams): Promise<readonly number[]>;
  getHistoricalChart(params?: HistoricalPriceParams): Promise<readonly HistoricalDataPoint[]>;
}
