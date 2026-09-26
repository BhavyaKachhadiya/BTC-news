import { NextResponse } from "next/server";
import { marketStructureService } from "@/features/market-structure/market-structure.service";
import { timeframeService } from "@/features/multi-timeframe/services/timeframe.service";
import type { Timeframe } from "@/features/multi-timeframe/types/timeframe.types";
import type { LiquidityBar } from "@/features/market-structure/types";
import { coingeckoService } from "@/features/market";
import { logger } from "@/shared/logger/logger";

export const dynamic = "force-dynamic";

const VALID_TIMEFRAMES: readonly Timeframe[] = ["5m", "15m", "1h", "4h", "1D"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawTf = searchParams.get("timeframe") || "15m";
  const timeframe: Timeframe = VALID_TIMEFRAMES.includes(rawTf as Timeframe)
    ? (rawTf as Timeframe)
    : "15m";

  try {
    let bars: LiquidityBar[] = [];
    let currentPrice = 84_100;

    // 1. Fetch high-precision klines from Binance/Bybit for the requested timeframe (default: 15m)
    try {
      const klines = await timeframeService.fetchKlines(timeframe, "BTCUSDT", 80);
      if (klines && klines.length >= 10) {
        bars = klines.map((k) => ({
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
          volume: k.volume,
          openTime: k.openTime,
          closeTime: k.closeTime,
        }));
        currentPrice = bars[bars.length - 1].close;
      }
    } catch (klineErr: unknown) {
      logger.warn(`Could not fetch ${timeframe} klines in market-structure route`, "API", { error: String(klineErr) });
    }

    // 2. Fallback to CoinGecko if klines failed
    if (bars.length < 10) {
      try {
        const market = await coingeckoService.getCurrentMarketData();
        if (market && market.price > 0) {
          currentPrice = market.price;
        }
      } catch (err: unknown) {
        logger.warn("Could not fetch latest market price from CoinGecko", "API", { error: String(err) });
      }

      let fallbackPrices: number[] = [];
      try {
        const hist = await coingeckoService.getHistoricalPrices({ days: 30, interval: "daily" });
        if (hist && hist.length >= 5) {
          fallbackPrices = [...hist];
        }
      } catch (err: unknown) {
        logger.warn("Could not fetch historical prices in market-structure route", "API", { error: String(err) });
      }

      if (fallbackPrices.length > 0 && fallbackPrices[fallbackPrices.length - 1] !== currentPrice) {
        fallbackPrices.push(currentPrice);
      }

      const data = marketStructureService.analyze(
        fallbackPrices.length >= 5 ? fallbackPrices : undefined,
        undefined,
        currentPrice,
        undefined,
        timeframe,
      );

      return NextResponse.json({
        success: true,
        data,
      });
    }

    // 3. Perform Market Structure and Liquidity Sweeps analysis with real 15m OHLC bars
    const data = marketStructureService.analyze(
      undefined,
      undefined,
      currentPrice,
      bars,
      timeframe,
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    logger.error("GET /api/market-structure error", "API", { error: String(error) });
    const data = marketStructureService.analyze(undefined, undefined, undefined, undefined, timeframe);
    return NextResponse.json({ success: true, data });
  }
}
