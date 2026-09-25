import { fetchJson } from "@/shared/http/fetcher";
import { logger } from "@/shared/logger/logger";
import { ValidationError, ProviderError } from "@/shared/errors/app-error";
import {
  binanceOpenInterestSchema,
  hyperliquidMetaAndAssetCtxsSchema,
} from "../schemas/derivatives.schema";
import type { OpenInterestData } from "../types/derivatives.types";

export class OpenInterestService {
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
   * Fetches live Open Interest for symbol from Binance Futures.
   */
  public async getBinanceOpenInterest(
    symbol = "BTCUSDT",
    markPrice?: number,
  ): Promise<OpenInterestData> {
    const url = `${this.binanceBaseUrl}/fapi/v1/openInterest?symbol=${symbol}`;
    logger.debug(`Fetching open interest from Binance: ${symbol}`, "OpenInterestService");

    const rawData = await fetchJson(url, {
      timeoutMs: 8000,
      providerName: "Binance Futures",
    });

    const parsed = binanceOpenInterestSchema.safeParse(rawData);
    if (!parsed.success) {
      logger.error("Binance open interest validation failed", "OpenInterestService", {
        issues: parsed.error.issues,
      });
      throw new ValidationError("Invalid Binance open interest format", parsed.error.issues);
    }

    const openInterest = Number.parseFloat(parsed.data.openInterest);
    if (Number.isNaN(openInterest) || openInterest < 0) {
      throw new ValidationError(`Invalid numeric openInterest: ${parsed.data.openInterest}`);
    }

    const openInterestUsd = markPrice ? openInterest * markPrice : undefined;

    return {
      symbol: parsed.data.symbol,
      openInterest,
      openInterestUsd,
      timestamp: parsed.data.time,
      provider: "binance",
      isExpansion: false,
    };
  }

  /**
   * Fetches Open Interest from Hyperliquid as fallback.
   */
  public async getHyperliquidOpenInterest(coin = "BTC"): Promise<OpenInterestData> {
    logger.debug(`Fetching open interest from Hyperliquid: ${coin}`, "OpenInterestService");

    const rawData = await fetchJson(this.hyperliquidUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
      timeoutMs: 8000,
      providerName: "Hyperliquid",
    });

    const parsed = hyperliquidMetaAndAssetCtxsSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new ValidationError("Invalid Hyperliquid response structure", parsed.error.issues);
    }

    const [meta, assetCtxs] = parsed.data;
    const assetIndex = meta.universe.findIndex((item) => item.name.toUpperCase() === coin.toUpperCase());

    if (assetIndex === -1 || !assetCtxs[assetIndex]) {
      throw new ProviderError("Hyperliquid", `Asset ${coin} not found in Hyperliquid universe`);
    }

    const assetCtx = assetCtxs[assetIndex];
    if (!assetCtx.openInterest) {
      throw new ValidationError(`Hyperliquid open interest missing for asset ${coin}`);
    }
    const openInterest = Number.parseFloat(assetCtx.openInterest ?? "0");
    if (Number.isNaN(openInterest) || openInterest < 0) {
      throw new ValidationError(`Invalid Hyperliquid open interest: ${assetCtx.openInterest}`);
    }

    const markPrice = assetCtx.markPx ? Number.parseFloat(assetCtx.markPx) : undefined;
    const openInterestUsd = markPrice ? openInterest * markPrice : undefined;

    return {
      symbol: `${coin}USDT`,
      openInterest,
      openInterestUsd,
      timestamp: Date.now(),
      provider: "hyperliquid",
      isExpansion: false,
    };
  }

  /**
   * Retrieves live Open Interest with automatic fallback to Hyperliquid.
   */
  public async getOpenInterest(symbol = "BTCUSDT", markPrice?: number): Promise<OpenInterestData> {
    try {
      return await this.getBinanceOpenInterest(symbol, markPrice);
    } catch (binanceError: unknown) {
      logger.warn("Binance open interest unavailable; falling back to Hyperliquid", "OpenInterestService", {
        error: String(binanceError),
      });

      const coin = symbol.replace("USDT", "").replace("USD", "");
      try {
        return await this.getHyperliquidOpenInterest(coin);
      } catch (hlError: unknown) {
        logger.error("Both Binance and Hyperliquid open interest failed", "OpenInterestService", {
          binanceError: String(binanceError),
          hyperliquidError: String(hlError),
        });
        throw binanceError;
      }
    }
  }
}

export const openInterestService = new OpenInterestService();
