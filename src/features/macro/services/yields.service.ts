import { logger } from "@/shared/logger/logger";
import { ProviderError } from "@/shared/errors/app-error";
import { fetchYahooChart, DEFAULT_MACRO_TIMEOUT_MS } from "./yahoo-client";
import type { YieldsQuote } from "../types/macro.types";

export const TEN_YEAR_SYMBOL = "^TNX";
export const TWO_YEAR_SYMBOL = "^IRX";

// Baseline reference yields when external finance APIs are cold-start unreachable
export const BASELINE_YIELDS_QUOTE: YieldsQuote = {
  tenYear: 4.28,
  twoYear: 4.15,
  spread: 0.13,
  timestamp: new Date().toISOString(),
};

/**
 * Normalizes yield quotes. Yahoo Finance ^TNX historically quotes 42.50 for 4.25%.
 * If the value is > 15, divide by 10 to yield standard percentage points.
 */
export function normalizeYieldValue(raw: number): number {
  if (raw > 15) {
    return Number((raw / 10).toFixed(3));
  }
  return Number(raw.toFixed(3));
}

export class YieldsService {
  private cachedQuote: YieldsQuote | null = null;
  private lastFetchedAt: number | null = null;
  private readonly timeoutMs: number;

  constructor(timeoutMs = DEFAULT_MACRO_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Fetches fresh US 10Y (^TNX) and 2Y (^IRX) Treasury yields concurrently.
   */
  public async fetchLiveYields(): Promise<YieldsQuote> {
    logger.debug("Fetching live US Treasury yields (^TNX & ^IRX)", "YieldsService");

    const [tenYearRaw, twoYearRaw] = await Promise.all([
      fetchYahooChart(TEN_YEAR_SYMBOL, { timeoutMs: this.timeoutMs }),
      fetchYahooChart(TWO_YEAR_SYMBOL, { timeoutMs: this.timeoutMs }),
    ]);

    if (!tenYearRaw && !twoYearRaw) {
      throw new ProviderError(
        "YahooFinance-Yields",
        "Failed to fetch both 10Y and 2Y Treasury yields",
      );
    }

    const tenYear = tenYearRaw ? normalizeYieldValue(tenYearRaw.price) : undefined;
    const twoYear = twoYearRaw ? normalizeYieldValue(twoYearRaw.price) : undefined;

    const spread =
      tenYear !== undefined && twoYear !== undefined
        ? Number((tenYear - twoYear).toFixed(3))
        : undefined;

    const timestamp = tenYearRaw?.timestamp || twoYearRaw?.timestamp || new Date().toISOString();

    const quote: YieldsQuote = {
      tenYear,
      twoYear,
      spread,
      timestamp,
    };

    this.cachedQuote = quote;
    this.lastFetchedAt = Date.now();
    return quote;
  }

  /**
   * Returns current Treasury yields with resilient fallback.
   */
  public async getYields(allowFallback = true): Promise<YieldsQuote> {
    try {
      return await this.fetchLiveYields();
    } catch (err: unknown) {
      logger.warn("Treasury yields live fetch failed, evaluating fallback", "YieldsService", {
        error: String(err),
      });

      if (this.cachedQuote) {
        logger.info("Using cached Treasury yields", "YieldsService");
        return this.cachedQuote;
      }

      if (allowFallback) {
        logger.info("Using baseline Treasury yields reference quote", "YieldsService");
        return {
          ...BASELINE_YIELDS_QUOTE,
          timestamp: new Date().toISOString(),
        };
      }

      throw err;
    }
  }

  public getCachedQuote(): YieldsQuote | null {
    return this.cachedQuote;
  }

  public setCachedQuote(quote: YieldsQuote): void {
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

export const yieldsService = new YieldsService();
