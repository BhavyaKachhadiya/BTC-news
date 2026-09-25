import { fetchJson } from "@/shared/http/fetcher";
import { logger } from "@/shared/logger/logger";
import { ProviderError, ValidationError } from "@/shared/errors/app-error";
import {
  calculateRSI,
  calculateEMA,
  calculateATR,
  calculateVolatility,
} from "@/features/technical-analysis";
import type { OHLCBar } from "@/features/technical-analysis";
import type {
  Timeframe,
  TimeframeAnalysis,
  TimeframeTrend,
  BinanceKlineBar,
} from "../types/timeframe.types";
import {
  binanceKlinesSchema,
  timeframeAnalysisSchema,
} from "../schemas/timeframe.schema";

export const SUPPORTED_TIMEFRAMES: readonly Timeframe[] = [
  "5m",
  "15m",
  "1h",
  "4h",
  "1D",
];

/**
 * Converts internal Timeframe representation to Binance API interval query param.
 */
export function toBinanceInterval(timeframe: Timeframe): string {
  switch (timeframe) {
    case "5m":
      return "5m";
    case "15m":
      return "15m";
    case "1h":
      return "1h";
    case "4h":
      return "4h";
    case "1D":
      return "1d";
  }
}

/**
 * Pure deterministic rule to classify trend for a single timeframe horizon.
 */
export function determineTimeframeTrend(input: {
  price: number;
  rsi: number;
  ema20: number;
  ema50: number;
  volatility?: number;
}): TimeframeTrend {
  const { price, rsi, ema20, ema50 } = input;

  // Bullish criteria:
  // Price > EMA20 and EMA20 > EMA50 with RSI >= 45 (avoiding collapsing divergence)
  if (price > ema20 && ema20 > ema50) {
    if (rsi >= 45) {
      return "bullish";
    }
    // Divergence: Price above EMAs but momentum collapsing
    return "uncertain";
  }

  // Bearish criteria:
  // Price < EMA20 and EMA20 < EMA50 with RSI <= 55 (avoiding false breakdowns)
  if (price < ema20 && ema20 < ema50) {
    if (rsi <= 55) {
      return "bearish";
    }
    // Divergence: Price below EMAs but momentum surging
    return "uncertain";
  }

  // Ranging criteria:
  // 1. Price is oscillating between EMA20 and EMA50, OR
  // 2. EMA20 and EMA50 are compressed (spread < 0.35%), OR
  // 3. RSI is in tight neutral consolidation (45 <= rsi <= 55)
  const emaSpread = Math.abs(ema20 - ema50) / ema50;
  const isBetweenEmas =
    (price >= ema20 && price <= ema50) || (price <= ema20 && price >= ema50);

  if (isBetweenEmas || emaSpread < 0.0035 || (rsi >= 45 && rsi <= 55)) {
    return "ranging";
  }

  // Conflicted or transitioning without clear structure
  return "uncertain";
}

export class TimeframeService {
  private readonly baseUrl: string;

  constructor(baseUrl = "https://api.binance.com") {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches raw Kline bars for a specific timeframe from public Binance API.
   */
  public async fetchKlines(
    timeframe: Timeframe,
    symbol = "BTCUSDT",
    limit = 60,
  ): Promise<BinanceKlineBar[]> {
    const interval = toBinanceInterval(timeframe);
    const url = `${this.baseUrl}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    try {
      const rawData = await fetchJson<unknown>(url, {
        providerName: "Binance",
        timeoutMs: 10000,
      });

      const parsed = binanceKlinesSchema.safeParse(rawData);
      if (!parsed.success) {
        throw new ValidationError(
          `Invalid kline payload structure for timeframe ${timeframe}`,
          parsed.error.issues,
        );
      }

      return parsed.data.map((k) => {
        const open = Number.parseFloat(k[1] as string);
        const high = Number.parseFloat(k[2] as string);
        const low = Number.parseFloat(k[3] as string);
        const close = Number.parseFloat(k[4] as string);
        const volume = Number.parseFloat(k[5] as string);

        if (Number.isNaN(open) || Number.isNaN(high) || Number.isNaN(low) || Number.isNaN(close)) {
          throw new ValidationError(`Encountered NaN price value in kline for timeframe ${timeframe}`);
        }

        return {
          openTime: k[0] as number,
          open,
          high,
          low,
          close,
          volume: Number.isNaN(volume) ? 0 : volume,
          closeTime: typeof k[6] === "number" ? k[6] : 0,
        };
      });
    } catch (error: unknown) {
      logger.error(`Failed to fetch Binance klines for ${timeframe}`, "TimeframeService", {
        error: String(error),
        symbol,
        timeframe,
      });
      if (error instanceof ProviderError || error instanceof ValidationError) {
        throw error;
      }
      throw new ProviderError(
        "Binance",
        `Failed to fetch klines for ${timeframe}: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  /**
   * Evaluates deterministic indicators and trend for a timeframe from parsed Kline bars.
   */
  public analyzeKlines(
    timeframe: Timeframe,
    bars: readonly BinanceKlineBar[],
  ): TimeframeAnalysis {
    if (!bars || bars.length < 20) {
      throw new ValidationError(
        `Insufficient klines for timeframe ${timeframe}: received ${bars?.length ?? 0}, minimum required is 20`,
      );
    }

    const prices = bars.map((b) => b.close);
    const currentPrice = prices[prices.length - 1];

    // Calculate deterministic indicators
    const rsi = calculateRSI(prices, 14);
    const ema20 = calculateEMA(prices, 20);
    const ema50Period = prices.length >= 50 ? 50 : prices.length;
    const ema50 = calculateEMA(prices, ema50Period);

    const ohlcBars: OHLCBar[] = bars.map((b) => ({
      high: b.high,
      low: b.low,
      close: b.close,
    }));
    const atr = calculateATR(ohlcBars, 14);
    const volatility = calculateVolatility(prices, 14);

    // Determine independent trend
    const trend = determineTimeframeTrend({
      price: currentPrice,
      rsi,
      ema20,
      ema50,
      volatility,
    });

    const analysis: TimeframeAnalysis = {
      timeframe,
      price: currentPrice,
      rsi,
      ema20,
      ema50,
      atr,
      volatility,
      trend,
    };

    return timeframeAnalysisSchema.parse(analysis);
  }

  /**
   * Fetches klines and calculates full independent analysis for a timeframe.
   */
  public async fetchAndAnalyze(
    timeframe: Timeframe,
    symbol = "BTCUSDT",
  ): Promise<TimeframeAnalysis> {
    const bars = await this.fetchKlines(timeframe, symbol);
    return this.analyzeKlines(timeframe, bars);
  }

  /**
   * Fetches and analyzes all supported timeframes independently.
   */
  public async analyzeAllTimeframes(
    symbol = "BTCUSDT",
  ): Promise<TimeframeAnalysis[]> {
    logger.debug("Fetching independent klines across 5 timeframes", "TimeframeService");
    const results = await Promise.all(
      SUPPORTED_TIMEFRAMES.map((tf) => this.fetchAndAnalyze(tf, symbol)),
    );
    return results;
  }
}

export const timeframeService = new TimeframeService();
