import { calculateRSI } from "@/features/technical-analysis/indicators/rsi";
import { calculateEMA } from "@/features/technical-analysis/indicators/ema";
import { calculateATR } from "@/features/technical-analysis/indicators/atr";
import type { BacktestCandle } from "../types/backtest.types";
import type { StrategyParameters } from "@/features/strategy-lab/types/strategy.types";
import { DEFAULT_STRATEGY_PARAMETERS } from "@/features/strategy-lab/types/strategy.types";

export interface ReplayStateAtStep {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly currentCandle: BacktestCandle;
  readonly rsi: number | null;
  readonly emaFast: number | null;
  readonly emaSlow: number | null;
  readonly atr: number | null;
  readonly signal: "LONG" | "SHORT" | "WAIT";
  readonly confidence: number;
  readonly signalReason: string;
}

export class DataReplayEngine {
  private candles: BacktestCandle[];
  private params: StrategyParameters;

  constructor(candles: BacktestCandle[], params: StrategyParameters = DEFAULT_STRATEGY_PARAMETERS) {
    this.candles = candles;
    this.params = params;
  }

  public setCandles(candles: BacktestCandle[]): void {
    this.candles = candles;
  }

  public setParameters(params: StrategyParameters): void {
    this.params = params;
  }

  public getTotalSteps(): number {
    return this.candles.length;
  }

  public getCandleAt(index: number): BacktestCandle | undefined {
    return this.candles[index];
  }

  /**
   * Computes the exact indicators and deterministic signal at step `stepIndex`
   * strictly using history up to `stepIndex` (zero look-ahead bias).
   */
  public evaluateStep(stepIndex: number): ReplayStateAtStep {
    const clampedIndex = Math.max(0, Math.min(stepIndex, this.candles.length - 1));
    const currentCandle = this.candles[clampedIndex];

    const historicalSlice = this.candles.slice(0, clampedIndex + 1);
    const closePrices = historicalSlice.map((c) => c.close);

    // Calculate indicators strictly on historical slice with safe fallbacks during warmup
    let currentRsi: number | null = null;
    try {
      currentRsi = calculateRSI(closePrices, 14);
    } catch {
      currentRsi = null;
    }

    let currentEmaFast: number | null = null;
    try {
      currentEmaFast = calculateEMA(closePrices, this.params.emaFastPeriod);
    } catch {
      currentEmaFast = null;
    }

    let currentEmaSlow: number | null = null;
    try {
      currentEmaSlow = calculateEMA(closePrices, this.params.emaSlowPeriod);
    } catch {
      currentEmaSlow = null;
    }

    let currentAtr: number | null = null;
    try {
      currentAtr = calculateATR(historicalSlice, 14);
    } catch {
      currentAtr = null;
    }

    // Deterministic signal rules
    let signal: "LONG" | "SHORT" | "WAIT" = "WAIT";
    let confidence = 50;
    let signalReason = "Indicators neutral; awaiting high probability confluence";

    if (currentRsi !== null && currentEmaFast !== null && currentEmaSlow !== null) {
      const isBullishEma = currentEmaFast > currentEmaSlow;
      const isBearishEma = currentEmaFast < currentEmaSlow;

      if (isBullishEma && currentRsi >= this.params.rsiLongThreshold) {
        signal = "LONG";
        confidence = Math.min(95, Math.round(65 + (currentRsi - this.params.rsiLongThreshold) * 1.2));
        signalReason = `Bullish trend: EMA ${this.params.emaFastPeriod} (${currentEmaFast.toFixed(0)}) > EMA ${this.params.emaSlowPeriod} (${currentEmaSlow.toFixed(0)}) with RSI momentum at ${currentRsi.toFixed(1)}`;
      } else if (isBearishEma && currentRsi <= this.params.rsiShortThreshold) {
        signal = "SHORT";
        confidence = Math.min(95, Math.round(65 + (this.params.rsiShortThreshold - currentRsi) * 1.2));
        signalReason = `Bearish trend: EMA ${this.params.emaFastPeriod} (${currentEmaFast.toFixed(0)}) < EMA ${this.params.emaSlowPeriod} (${currentEmaSlow.toFixed(0)}) with RSI exhaustion at ${currentRsi.toFixed(1)}`;
      } else if (currentRsi < 30) {
        signal = "LONG";
        confidence = Math.min(90, Math.round(70 + (30 - currentRsi) * 1.5));
        signalReason = `Oversold mean-reversion setup: RSI at ${currentRsi.toFixed(1)}`;
      } else if (currentRsi > 70) {
        signal = "SHORT";
        confidence = Math.min(90, Math.round(70 + (currentRsi - 70) * 1.5));
        signalReason = `Overbought exhaustion setup: RSI at ${currentRsi.toFixed(1)}`;
      }
    }

    return {
      stepIndex: clampedIndex,
      totalSteps: this.candles.length,
      currentCandle,
      rsi: currentRsi,
      emaFast: currentEmaFast,
      emaSlow: currentEmaSlow,
      atr: currentAtr,
      signal,
      confidence,
      signalReason,
    };
  }
}
