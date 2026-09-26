import { fetchJson } from "@/shared/http/fetcher";
import { logger } from "@/shared/logger/logger";
import { ValidationError } from "@/shared/errors/app-error";
import { binanceLongShortRatioResponseSchema } from "../schemas/derivatives.schema";
import type { LongShortRatioData } from "../types/derivatives.types";

export class PositioningService {
  private readonly baseUrl: string;

  constructor(baseUrl = "https://fapi.binance.com") {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches Global Long/Short Account Ratio from Binance Futures.
   */
  public async getGlobalLongShortRatio(
    symbol = "BTCUSDT",
    period = "1h",
    limit = 5,
  ): Promise<LongShortRatioData> {
    const url = `${this.baseUrl}/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=${limit}`;
    logger.debug(`Fetching Long/Short ratio from Binance: ${symbol} (${period})`, "PositioningService");

    try {
      const rawData = await fetchJson(url, {
        timeoutMs: 8000,
        providerName: "Binance Futures Positioning",
      });

      const parsed = binanceLongShortRatioResponseSchema.safeParse(rawData);
      if (!parsed.success || parsed.data.length === 0) {
        logger.error("Binance long/short ratio validation failed", "PositioningService", {
          issues: parsed.success ? "Empty array" : parsed.error.issues,
        });
        throw new ValidationError("Invalid Binance Long/Short ratio response", parsed.success ? [] : parsed.error.issues);
      }

      // Sort by timestamp descending to get the newest entry
      const sorted = [...parsed.data].sort((a, b) => b.timestamp - a.timestamp);
      const latest = sorted[0];

      const longShortRatio = Number.parseFloat(latest.longShortRatio);
      const longAccount = Number.parseFloat(latest.longAccount);
      const shortAccount = Number.parseFloat(latest.shortAccount);

      if (Number.isNaN(longShortRatio) || Number.isNaN(longAccount) || Number.isNaN(shortAccount)) {
        throw new ValidationError(
          `Invalid numeric Long/Short ratio data: ${JSON.stringify(latest)}`,
        );
      }

      const isImbalanced = longShortRatio > 1.8 || longShortRatio < 0.6;
      let imbalanceSide: "LONG" | "SHORT" | "BALANCED" = "BALANCED";
      if (longShortRatio > 1.8) {
        imbalanceSide = "LONG";
      } else if (longShortRatio < 0.6) {
        imbalanceSide = "SHORT";
      }

      return {
        symbol: latest.symbol,
        longShortRatio,
        longAccount,
        shortAccount,
        timestamp: latest.timestamp,
        provider: "binance",
        isImbalanced,
        imbalanceSide,
      };
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.warn(
        "Binance Long/Short ratio unavailable (geo-restricted or network error); falling back to neutral balanced ratio",
        "PositioningService",
        { error: String(error) },
      );
      return {
        symbol,
        longShortRatio: 1.0,
        longAccount: 0.5,
        shortAccount: 0.5,
        timestamp: Date.now(),
        provider: "fallback_neutral",
        isImbalanced: false,
        imbalanceSide: "BALANCED",
      };
    }
  }
}

export const positioningService = new PositioningService();
