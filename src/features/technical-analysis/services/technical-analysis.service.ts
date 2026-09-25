import { calculateRSI } from "../indicators/rsi";
import { calculateEMA } from "../indicators/ema";
import { calculateSMA } from "../indicators/sma";
import { calculateATR, synthesizeBarsFromPrices } from "../indicators/atr";
import { calculateVolatility, calculatePriceChange, calculateVolumeChange } from "../indicators/volatility";
import { IndicatorError } from "@/shared/errors/app-error";
import type { TechnicalState, TechnicalInputData } from "../types/technical.types";

export class TechnicalAnalysisService {
  /**
   * Evaluates all deterministic indicators from raw price and volume series.
   *
   * @param input Data containing historical closing prices and optional volumes.
   * @returns Complete deterministic TechnicalState.
   */
  public analyze(input: TechnicalInputData): TechnicalState {
    const { prices, volumes } = input;

    if (!prices || prices.length < 20) {
      throw new IndicatorError(
        "TechnicalAnalysisService",
        `Insufficient price history: received ${prices?.length ?? 0}, minimum required is 20`,
      );
    }

    const currentPrice = prices[prices.length - 1];

    // RSI 14
    const rsi14 = calculateRSI(prices, 14);

    // EMA 20
    const ema20 = calculateEMA(prices, 20);

    // EMA 50 (if prices < 50, fallback to EMA of all available prices or calculateEMA with available length)
    const ema50Period = prices.length >= 50 ? 50 : prices.length;
    const ema50 = calculateEMA(prices, ema50Period);

    // SMA 20
    const sma20 = calculateSMA(prices, 20);

    // ATR 14
    const bars = synthesizeBarsFromPrices(prices);
    const atr14 = calculateATR(bars, 14);

    // Volatility 14
    const volatility = calculateVolatility(prices, 14);

    // Price change (last step)
    const priceChange = calculatePriceChange(prices, 1);

    // Volume change
    const volumeChange = volumes && volumes.length >= 2 ? calculateVolumeChange(volumes) : undefined;

    return {
      rsi14,
      ema20,
      ema50,
      sma20,
      atr14,
      volatility,
      priceChange,
      volumeChange,
      currentPrice,
      timestamp: new Date().toISOString(),
    };
  }
}

export const technicalAnalysisService = new TechnicalAnalysisService();
