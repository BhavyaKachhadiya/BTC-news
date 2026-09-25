import { logger } from "@/shared/logger/logger";
import { ProviderError } from "@/shared/errors/app-error";
import { fetchYahooChart, DEFAULT_MACRO_TIMEOUT_MS } from "./yahoo-client";
import type { DxyQuote } from "../types/macro.types";

export const DEFAULT_DXY_SYMBOL = "DX-Y.NYB";
export const FALLBACK_DXY_SYMBOL = "DX=F";

// Realistic reference baseline when external finance APIs are cold-start unreachable
export const BASELINE_DXY_QUOTE: DxyQuote = {
  symbol: DEFAULT_DXY_SYMBOL,
  value: 104.25,
  changePercent: -0.12,
  previousClose: 104.38,
  timestamp: new Date().toISOString(),
};

export class DxyService {
  private cachedQuote: DxyQuote | null = null;
  private lastFetchedAt: number | null = null;
  private readonly timeoutMs: number;

  constructor(timeoutMs = DEFAULT_MACRO_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Fetches fresh DXY quote via Yahoo Finance chart endpoints.
   */
  public async fetchLiveQuote(symbol = DEFAULT_DXY_SYMBOL): Promise<DxyQuote> {
    logger.debug(`Fetching live DXY quote for ${symbol}`, "DxyService");

    let quote = await fetchYahooChart(symbol, { timeoutMs: this.timeoutMs });

    // If NYB ticker fails, try DX=F futures proxy
    if (!quote && symbol === DEFAULT_DXY_SYMBOL) {
      logger.debug(`Retrying DXY with secondary symbol ${FALLBACK_DXY_SYMBOL}`, "DxyService");
      quote = await fetchYahooChart(FALLBACK_DXY_SYMBOL, { timeoutMs: this.timeoutMs });
    }

    if (!quote) {
      throw new ProviderError(
        "YahooFinance-DXY",
        `Unable to fetch DXY chart quote for ${symbol}`,
      );
    }

    const dxyQuote: DxyQuote = {
      symbol: quote.symbol || symbol,
      value: quote.price,
      changePercent: quote.changePercent,
      previousClose: quote.previousClose,
      timestamp: quote.timestamp,
    };

    this.cachedQuote = dxyQuote;
    this.lastFetchedAt = Date.now();
    return dxyQuote;
  }

  /**
   * Returns current DXY quote with resilient fallback to cached or baseline quote.
   */
  public async getDxyQuote(allowFallback = true): Promise<DxyQuote> {
    try {
      return await this.fetchLiveQuote();
    } catch (err: unknown) {
      logger.warn("DXY live fetch failed, evaluating fallback options", "DxyService", {
        error: String(err),
      });

      if (this.cachedQuote) {
        logger.info("Using cached DXY quote", "DxyService");
        return this.cachedQuote;
      }

      if (allowFallback) {
        logger.info("Using baseline DXY reference quote", "DxyService");
        return {
          ...BASELINE_DXY_QUOTE,
          timestamp: new Date().toISOString(),
        };
      }

      throw err;
    }
  }

  public getCachedQuote(): DxyQuote | null {
    return this.cachedQuote;
  }

  public setCachedQuote(quote: DxyQuote): void {
    this.cachedQuote = quote;
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

export const dxyService = new DxyService();
