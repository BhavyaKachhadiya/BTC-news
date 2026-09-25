import { fetchJson } from "@/shared/http/fetcher";
import { logger } from "@/shared/logger/logger";
import { ValidationError, ProviderError } from "@/shared/errors/app-error";
import {
  binanceFundingRateResponseSchema,
  hyperliquidMetaAndAssetCtxsSchema,
} from "../schemas/derivatives.schema";
import type { FundingRateData } from "../types/derivatives.types";

export class FundingService {
  private readonly binanceBaseUrl: string;
  private readonly hyperliquidUrl: string;

  constructor(
    binanceBaseUrl = "https://fapi.binance.com",
    hyperliquidUrl = "https://api.hyperliquid.xyz/info",
  ) {
    this.binanceBaseUrl = binanceBaseUrl;
    this.hyperliquidUrl = hyperliquidUrl;
  }

  /**
   * Fetches live funding rate from Binance Futures.
   */
  public async getBinanceFundingRate(symbol = "BTCUSDT", limit = 5): Promise<FundingRateData> {
    const url = `${this.binanceBaseUrl}/fapi/v1/fundingRate?symbol=${symbol}&limit=${limit}`;
    logger.debug(`Fetching funding rate from Binance: ${symbol}`, "FundingService");

    const rawData = await fetchJson(url, {
      timeoutMs: 8000,
      providerName: "Binance Futures",
    });

    const parsed = binanceFundingRateResponseSchema.safeParse(rawData);
    if (!parsed.success || parsed.data.length === 0) {
      logger.error("Binance funding rate schema validation failed", "FundingService", {
        issues: parsed.success ? "Empty array" : parsed.error.issues,
      });
      throw new ValidationError("Invalid Binance funding rate format", parsed.success ? [] : parsed.error.issues);
    }

    // Get the latest entry (highest timestamp or last entry)
    const sorted = [...parsed.data].sort((a, b) => b.fundingTime - a.fundingTime);
    const latest = sorted[0];

    const rawRate = Number.parseFloat(latest.fundingRate);
    if (Number.isNaN(rawRate)) {
      throw new ValidationError(`Invalid numeric fundingRate value: ${latest.fundingRate}`);
    }

    // Convert decimal to percentage (e.g. 0.0001 -> 0.01%)
    const fundingRate = rawRate * 100;
    const isSpike = fundingRate > 0.05 || fundingRate < -0.02;

    let bias: "NEUTRAL" | "HIGH_LONGS" | "HIGH_SHORTS" = "NEUTRAL";
    if (fundingRate > 0.03) {
      bias = "HIGH_LONGS";
    } else if (fundingRate < -0.01) {
      bias = "HIGH_SHORTS";
    }

    const markPrice = latest.markPrice ? Number.parseFloat(latest.markPrice) : undefined;

    return {
      symbol: latest.symbol,
      fundingRate,
      rawFundingRate: rawRate,
      fundingTime: latest.fundingTime,
      markPrice: markPrice && !Number.isNaN(markPrice) ? markPrice : undefined,
      provider: "binance",
      isSpike,
      bias,
    };
  }

  /**
   * Fetches funding rate from Hyperliquid as a cross-check or fallback.
   * Note: Hyperliquid rates are hourly; we normalize to an 8-hour equivalent percentage
   * to align with industry standard funding intervals.
   */
  public async getHyperliquidFundingRate(coin = "BTC"): Promise<FundingRateData> {
    logger.debug(`Fetching funding rate from Hyperliquid: ${coin}`, "FundingService");

    const rawData = await fetchJson(this.hyperliquidUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
      timeoutMs: 8000,
      providerName: "Hyperliquid",
    });

    const parsed = hyperliquidMetaAndAssetCtxsSchema.safeParse(rawData);
    if (!parsed.success) {
      logger.error("Hyperliquid metaAndAssetCtxs validation failed", "FundingService", {
        issues: parsed.error.issues,
      });
      throw new ValidationError("Invalid Hyperliquid response structure", parsed.error.issues);
    }

    const [meta, assetCtxs] = parsed.data;
    const assetIndex = meta.universe.findIndex((item) => item.name.toUpperCase() === coin.toUpperCase());

    if (assetIndex === -1 || !assetCtxs[assetIndex]) {
      throw new ProviderError("Hyperliquid", `Asset ${coin} not found in Hyperliquid universe`);
    }

    const assetCtx = assetCtxs[assetIndex];
    if (!assetCtx.funding) {
      throw new ValidationError(`Hyperliquid funding value missing for asset ${coin}`);
    }
    const rawHourlyFunding = Number.parseFloat(assetCtx.funding ?? "0");
    if (Number.isNaN(rawHourlyFunding)) {
      throw new ValidationError(`Invalid Hyperliquid funding value: ${assetCtx.funding}`);
    }

    // Convert hourly rate to 8-hour equivalent percentage: hourly * 8 * 100
    const rawFundingRate = rawHourlyFunding * 8;
    const fundingRate = rawFundingRate * 100;
    const isSpike = fundingRate > 0.05 || fundingRate < -0.02;

    let bias: "NEUTRAL" | "HIGH_LONGS" | "HIGH_SHORTS" = "NEUTRAL";
    if (fundingRate > 0.03) {
      bias = "HIGH_LONGS";
    } else if (fundingRate < -0.01) {
      bias = "HIGH_SHORTS";
    }

    const markPrice = assetCtx.markPx ? Number.parseFloat(assetCtx.markPx) : undefined;

    return {
      symbol: `${coin}USDT`,
      fundingRate,
      rawFundingRate,
      fundingTime: Date.now(),
      markPrice: markPrice && !Number.isNaN(markPrice) ? markPrice : undefined,
      provider: "hyperliquid",
      isSpike,
      bias,
    };
  }

  /**
   * Retrieves live funding rate with automatic fallback to Hyperliquid if Binance is unreachable.
   */
  public async getFundingRate(symbol = "BTCUSDT"): Promise<FundingRateData> {
    try {
      return await this.getBinanceFundingRate(symbol);
    } catch (binanceError: unknown) {
      logger.warn("Binance funding rate unavailable; falling back to Hyperliquid", "FundingService", {
        error: String(binanceError),
      });

      const coin = symbol.replace("USDT", "").replace("USD", "");
      try {
        return await this.getHyperliquidFundingRate(coin);
      } catch (hlError: unknown) {
        logger.error("Both Binance and Hyperliquid funding sources failed", "FundingService", {
          binanceError: String(binanceError),
          hyperliquidError: String(hlError),
        });
        throw binanceError;
      }
    }
  }
}

export const fundingService = new FundingService();
