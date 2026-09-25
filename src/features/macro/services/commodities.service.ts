import { logger } from "@/shared/logger/logger";
import { ProviderError } from "@/shared/errors/app-error";
import { fetchYahooChart, DEFAULT_MACRO_TIMEOUT_MS } from "./yahoo-client";
import type { CommodityQuote } from "../types/macro.types";

export const GOLD_SYMBOL = "GC=F";

// Baseline reference quote when external finance APIs are cold-start unreachable
export const BASELINE_GOLD_QUOTE: CommodityQuote = {
  symbol: GOLD_SYMBOL,
  price: 2685.5,
  changePercent: 0.32,
  previousClose: 2677.0,
  timestamp: new Date().toISOString(),
};

export class CommoditiesService {
  private cachedGold: CommodityQuote | null = null;
  private lastFetchedAt: number | null = null;
  private readonly timeoutMs: number;

  constructor(timeoutMs = DEFAULT_MACRO_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Ingest Gold (GC=F) quote via Yahoo Finance.
   */
  public async fetchLiveGold(): Promise<CommodityQuote> {
    logger.debug(`Fetching live Gold quote (${GOLD_SYMBOL})`, "CommoditiesService");

    const raw = await fetchYahooChart(GOLD_SYMBOL, { timeoutMs: this.timeoutMs });

    if (!raw) {
      throw new ProviderError(
        "YahooFinance-Gold",
        `Unable to fetch Gold chart quote for ${GOLD_SYMBOL}`,
      );
    }

    const quote: CommodityQuote = {
      symbol: GOLD_SYMBOL,
      price: raw.price,
      changePercent: raw.changePercent,
      previousClose: raw.previousClose,
      timestamp: raw.timestamp,
    };

    this.cachedGold = quote;
    this.lastFetchedAt = Date.now();
    return quote;
  }

  /**
   * Returns current Gold quote with resilient fallback to cached or baseline quote.
   */
  public async getGoldQuote(allowFallback = true): Promise<CommodityQuote> {
    try {
      return await this.fetchLiveGold();
    } catch (err: unknown) {
      logger.warn("Gold live fetch failed, evaluating fallback", "CommoditiesService", {
        error: String(err),
      });

      if (this.cachedGold) {
        logger.info("Using cached Gold quote", "CommoditiesService");
        return this.cachedGold;
      }

      if (allowFallback) {
        logger.info("Using baseline Gold reference quote", "CommoditiesService");
        return {
          ...BASELINE_GOLD_QUOTE,
          timestamp: new Date().toISOString(),
        };
      }

      throw err;
    }
  }

  public getCachedQuote(): CommodityQuote | null {
    return this.cachedGold;
  }

  public setCachedQuote(quote: CommodityQuote): void {
    this.cachedGold = quote;
    this.lastFetchedAt = Date.now();
  }

  public getLastFetchedAt(): number | null {
    return this.lastFetchedAt;
  }

  public isStale(maxAgeMs = 1000 * 60 * 60 * 24): boolean {
    if (!this.lastFetchedAt) return true;
    return Date.now() - this.lastFetchedAt > maxAgeMs;
  }
}

export const commoditiesService = new CommoditiesService();
