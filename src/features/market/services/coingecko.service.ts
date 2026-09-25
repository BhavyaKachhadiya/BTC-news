import { env } from "@/config/env";
import { fetchJson } from "@/shared/http/fetcher";
import { ProviderError, ValidationError } from "@/shared/errors/app-error";
import { logger } from "@/shared/logger/logger";
import {
  coinGeckoSimplePriceSchema,
  coinGeckoMarketChartSchema,
} from "../schemas/market.schema";
import type {
  MarketData,
  MarketDataProvider,
  HistoricalPriceParams,
  HistoricalDataPoint,
} from "../types/market.types";

export class CoinGeckoService implements MarketDataProvider {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(apiKey?: string) {
    const key = apiKey || env.COINGECKO_API_KEY;
    if (key && key.startsWith("CG-")) {
      this.baseUrl = "https://api.coingecko.com/api/v3";
      this.headers = { "x-cg-demo-api-key": key };
    } else if (key) {
      this.baseUrl = "https://pro-api.coingecko.com/api/v3";
      this.headers = { "x-cg-pro-api-key": key };
    } else {
      this.baseUrl = "https://api.coingecko.com/api/v3";
      this.headers = {};
    }
  }

  public async getCurrentMarketData(): Promise<MarketData> {
    const url = `${this.baseUrl}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`;
    logger.debug("Fetching current BTC market data from CoinGecko", "CoinGeckoService");

    let rawData: unknown;
    try {
      rawData = await fetchJson(url, {
        headers: this.headers,
        timeoutMs: 12000,
        providerName: "CoinGecko",
      });
    } catch (error: unknown) {
      logger.error("Failed to fetch market data from CoinGecko", "CoinGeckoService", { error: String(error) });
      throw error;
    }

    const parseResult = coinGeckoSimplePriceSchema.safeParse(rawData);
    if (!parseResult.success) {
      logger.error("CoinGecko simple price schema mismatch", "CoinGeckoService", {
        issues: parseResult.error.issues,
      });
      throw new ValidationError("Invalid CoinGecko market response structure", parseResult.error.issues);
    }

    const btc = parseResult.data.bitcoin;
    return {
      price: btc.usd,
      change24h: btc.usd_24h_change ?? 0,
      volume24h: btc.usd_24h_vol ?? 0,
      marketCap: btc.usd_market_cap ?? 0,
      timestamp: new Date().toISOString(),
      provider: "coingecko",
    };
  }

  public async getHistoricalPrices(params: HistoricalPriceParams = {}): Promise<readonly number[]> {
    const chart = await this.getHistoricalChart(params);
    return chart.map((point) => point.price);
  }

  public async getHistoricalChart(params: HistoricalPriceParams = {}): Promise<readonly HistoricalDataPoint[]> {
    const { days = 30, interval = "daily" } = params;
    const url = `${this.baseUrl}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=${interval}`;

    logger.debug(`Fetching ${days} days of BTC historical prices from CoinGecko`, "CoinGeckoService");

    let rawData: unknown;
    try {
      rawData = await fetchJson(url, {
        headers: this.headers,
        timeoutMs: 15000,
        providerName: "CoinGecko",
      });
    } catch (error: unknown) {
      logger.error("Failed to fetch historical chart from CoinGecko", "CoinGeckoService", { error: String(error) });
      throw error;
    }

    const parseResult = coinGeckoMarketChartSchema.safeParse(rawData);
    if (!parseResult.success) {
      logger.error("CoinGecko market chart schema mismatch", "CoinGeckoService", {
        issues: parseResult.error.issues,
      });
      throw new ValidationError("Invalid CoinGecko chart response structure", parseResult.error.issues);
    }

    return parseResult.data.prices.map(([timestamp, price]) => ({
      timestamp,
      price,
    }));
  }
}

export const coingeckoService = new CoinGeckoService();
