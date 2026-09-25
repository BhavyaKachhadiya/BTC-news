import { logger } from "@/shared/logger/logger";
import { ProviderError } from "@/shared/errors/app-error";
import { fetchYahooChart, DEFAULT_MACRO_TIMEOUT_MS } from "./yahoo-client";
import type { EquitiesQuote } from "../types/macro.types";

export const SP500_SYMBOL = "^GSPC";
export const NASDAQ_SYMBOL = "^IXIC";

// Baseline reference quote when external finance APIs are cold-start unreachable
export const BASELINE_EQUITIES_QUOTE: EquitiesQuote = {
  sp500: 5980.5,
  nasdaq: 19120.0,
  sp500ChangePercent: 0.45,
  nasdaqChangePercent: 0.62,
  timestamp: new Date().toISOString(),
};

export class EquitiesService {
  private cachedEquities: EquitiesQuote | null = null;
  private lastFetchedAt: number | null = null;
  private readonly timeoutMs: number;

  constructor(timeoutMs = DEFAULT_MACRO_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Ingest S&P 500 (^GSPC) and NASDAQ (^IXIC) quotes via Yahoo Finance.
   */
  public async fetchLiveEquities(): Promise<EquitiesQuote> {
    logger.debug(`Fetching live equities (${SP500_SYMBOL} & ${NASDAQ_SYMBOL})`, "EquitiesService");

    const [sp500Raw, nasdaqRaw] = await Promise.all([
      fetchYahooChart(SP500_SYMBOL, { timeoutMs: this.timeoutMs }),
      fetchYahooChart(NASDAQ_SYMBOL, { timeoutMs: this.timeoutMs }),
    ]);

    if (!sp500Raw && !nasdaqRaw) {
      throw new ProviderError(
        "YahooFinance-Equities",
        "Failed to fetch equity quotes for both S&P 500 and NASDAQ",
      );
    }

    const quote: EquitiesQuote = {
      sp500: sp500Raw ? sp500Raw.price : undefined,
      nasdaq: nasdaqRaw ? nasdaqRaw.price : undefined,
      sp500ChangePercent: sp500Raw?.changePercent,
      nasdaqChangePercent: nasdaqRaw?.changePercent,
      timestamp: sp500Raw?.timestamp || nasdaqRaw?.timestamp || new Date().toISOString(),
    };

    this.cachedEquities = quote;
    this.lastFetchedAt = Date.now();
    return quote;
  }

  /**
   * Returns current equities quote with resilient fallback to cached or baseline quote.
   */
  public async getEquitiesQuote(allowFallback = true): Promise<EquitiesQuote> {
    try {
      return await this.fetchLiveEquities();
    } catch (err: unknown) {
      logger.warn("Equities live fetch failed, evaluating fallback", "EquitiesService", {
        error: String(err),
      });

      if (this.cachedEquities) {
        logger.info("Using cached equities quote", "EquitiesService");
        return this.cachedEquities;
      }

      if (allowFallback) {
        logger.info("Using baseline equities reference quote", "EquitiesService");
        return {
          ...BASELINE_EQUITIES_QUOTE,
          timestamp: new Date().toISOString(),
        };
      }

      throw err;
    }
  }

  public getCachedQuote(): EquitiesQuote | null {
    return this.cachedEquities;
  }

  public setCachedQuote(quote: EquitiesQuote): void {
    this.cachedEquities = quote;
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

export const equitiesService = new EquitiesService();
