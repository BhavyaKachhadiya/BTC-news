import { calculateEMA } from "@/features/technical-analysis/indicators/ema";
import { calculateRSI } from "@/features/technical-analysis/indicators/rsi";
import { metricsService } from "@/features/performance/services/metrics.service";
import type {
  BacktestConfig,
  BacktestTrade,
  BacktestResult,
  BacktestCandle,
  BacktestAction,
} from "../types/backtest.types";
import type { StrategyParameters } from "@/features/strategy-lab/types/strategy.types";
import type { IntelligenceFeatures } from "@/config/features";

interface OpenPosition {
  readonly side: "LONG" | "SHORT";
  readonly entryPrice: number;
  readonly entryTimestamp: string;
  readonly sizeBtc: number;
  readonly allocatedUsd: number;
}

export class BacktestService {
  /**
   * Runs a historical backtest strictly preventing lookahead bias.
   *
   * Iterates chronologically through candles. At step i, only candles[0..i]
   * are visible to indicators and decision logic.
   *
   * @param config Backtest configuration including strategy parameters and feature flags.
   * @param candles Chronological sequence of historical candles.
   * @returns Complete BacktestResult with trade log and performance metrics.
   */
  public runBacktest(
    config: BacktestConfig,
    candles: readonly BacktestCandle[],
  ): BacktestResult {
    const { initialBalance, feeBps, strategyParams, featureFlags } = config;

    // Filter by date range if provided, and sort chronologically
    let sortedCandles = [...candles];
    if (config.startDate) {
      const startMs = new Date(config.startDate).getTime();
      sortedCandles = sortedCandles.filter(
        (c) => new Date(c.timestamp).getTime() >= startMs,
      );
    }
    if (config.endDate) {
      const endMs = new Date(config.endDate).getTime();
      sortedCandles = sortedCandles.filter(
        (c) => new Date(c.timestamp).getTime() <= endMs,
      );
    }

    sortedCandles.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const minWarmup = Math.max(
      strategyParams.emaSlowPeriod,
      15, // RSI requires at least period + 1
    );

    if (sortedCandles.length <= minWarmup) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalReturnPercent: 0,
        maxDrawdownPercent: 0,
        sharpeRatio: 0,
        profitFactor: 0,
        equityCurve: [
          {
            timestamp: sortedCandles[0]?.timestamp ?? config.startDate ?? new Date().toISOString(),
            equity: initialBalance,
          },
        ],
        trades: [],
      };
    }

    let cashBalance = initialBalance;
    let openPosition: OpenPosition | null = null;
    const closedTrades: BacktestTrade[] = [];
    const equityCurve: { timestamp: string; equity: number }[] = [
      {
        timestamp: sortedCandles[0].timestamp,
        equity: initialBalance,
      },
    ];

    const feeRate = feeBps / 10000;

    // Chronological simulation loop (NO LOOKAHEAD BIAS)
    for (let i = minWarmup; i < sortedCandles.length; i++) {
      const currentCandle = sortedCandles[i];
      // ONLY past and current candles up to index i are visible
      const historicalCandles = sortedCandles.slice(0, i + 1);
      const closedPrices = historicalCandles.map((c) => c.close);

      // Evaluate deterministic signal for the current candle
      const { action } = this.evaluateSignal(
        closedPrices,
        historicalCandles,
        strategyParams,
        featureFlags,
      );

      // 1. If in an open position, check for Stop Loss / Take Profit intra-candle
      if (openPosition) {
        let exitPrice: number | null = null;
        let exitReason: string | null = null;

        if (openPosition.side === "LONG") {
          const stopLossPrice =
            openPosition.entryPrice * (1 - strategyParams.stopLossPercent / 100);
          const takeProfitPrice =
            openPosition.entryPrice * (1 + strategyParams.takeProfitPercent / 100);

          if (currentCandle.low <= stopLossPrice) {
            exitPrice = Math.min(stopLossPrice, currentCandle.open);
            exitReason = "STOP_LOSS";
          } else if (currentCandle.high >= takeProfitPrice) {
            exitPrice = Math.max(takeProfitPrice, currentCandle.open);
            exitReason = "TAKE_PROFIT";
          } else if (action === "SHORT") {
            // Opposite signal exit at close
            exitPrice = currentCandle.close;
            exitReason = "OPPOSITE_SIGNAL";
          }
        } else {
          // SHORT position
          const stopLossPrice =
            openPosition.entryPrice * (1 + strategyParams.stopLossPercent / 100);
          const takeProfitPrice =
            openPosition.entryPrice * (1 - strategyParams.takeProfitPercent / 100);

          if (currentCandle.high >= stopLossPrice) {
            exitPrice = Math.max(stopLossPrice, currentCandle.open);
            exitReason = "STOP_LOSS";
          } else if (currentCandle.low <= takeProfitPrice) {
            exitPrice = Math.min(takeProfitPrice, currentCandle.open);
            exitReason = "TAKE_PROFIT";
          } else if (action === "LONG") {
            // Opposite signal exit at close
            exitPrice = currentCandle.close;
            exitReason = "OPPOSITE_SIGNAL";
          }
        }

        // Close position if exit condition was met
        if (exitPrice !== null && exitReason !== null) {
          const trade = this.closePosition(
            openPosition,
            exitPrice,
            currentCandle.timestamp,
            exitReason,
            feeRate,
          );
          closedTrades.push(trade);
          cashBalance += trade.pnlUsd;
          openPosition = null;
        }
      }

      // 2. If no position is open (or position was just closed), can open a new position at candle close
      if (!openPosition && (action === "LONG" || action === "SHORT")) {
        const allocatedUsd = Math.max(cashBalance * 0.95, 10);
        const sizeBtc = allocatedUsd / currentCandle.close;

        openPosition = {
          side: action,
          entryPrice: currentCandle.close,
          entryTimestamp: currentCandle.timestamp,
          sizeBtc,
          allocatedUsd,
        };
      }

      // 3. Record mark-to-market equity point
      let currentEquity = cashBalance;
      if (openPosition) {
        const entryFee = openPosition.allocatedUsd * feeRate;
        const exitFee =
          openPosition.sizeBtc * currentCandle.close * feeRate;
        const grossPnl =
          openPosition.side === "LONG"
            ? (currentCandle.close - openPosition.entryPrice) * openPosition.sizeBtc
            : (openPosition.entryPrice - currentCandle.close) * openPosition.sizeBtc;
        const unrealizedPnl = grossPnl - entryFee - exitFee;
        currentEquity = cashBalance + unrealizedPnl;
      }

      equityCurve.push({
        timestamp: currentCandle.timestamp,
        equity: Number(currentEquity.toFixed(2)),
      });
    }

    // Close any position remaining open at final candle close
    if (openPosition && sortedCandles.length > 0) {
      const finalCandle = sortedCandles[sortedCandles.length - 1];
      const trade = this.closePosition(
        openPosition,
        finalCandle.close,
        finalCandle.timestamp,
        "END_OF_PERIOD",
        feeRate,
      );
      closedTrades.push(trade);
      cashBalance += trade.pnlUsd;
      openPosition = null;

      // Update final equity point
      if (equityCurve.length > 0) {
        equityCurve[equityCurve.length - 1] = {
          timestamp: finalCandle.timestamp,
          equity: Number(cashBalance.toFixed(2)),
        };
      }
    }

    // Compute aggregate performance metrics
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter((t) => t.pnlUsd > 0).length;
    const losingTrades = closedTrades.filter((t) => t.pnlUsd < 0).length;
    const winRate = metricsService.calculateWinRate(winningTrades, totalTrades);
    const finalEquity =
      equityCurve.length > 0
        ? equityCurve[equityCurve.length - 1].equity
        : cashBalance;
    const totalReturnPercent = metricsService.calculateTotalReturnPercent(
      initialBalance,
      finalEquity,
    );
    const maxDrawdownPercent = metricsService.calculateMaxDrawdown(
      equityCurve.map((p) => p.equity),
    );
    const sharpeRatio = metricsService.calculateSharpeRatio(
      closedTrades.map((t) => t.pnlPercent),
    );
    const profitFactor = metricsService.calculateProfitFactor(closedTrades);

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalReturnPercent,
      maxDrawdownPercent,
      sharpeRatio,
      profitFactor,
      equityCurve,
      trades: closedTrades,
    };
  }

  /**
   * Deterministically evaluates signal action and confidence score
   * without access to future data.
   */
  public evaluateSignal(
    closedPrices: readonly number[],
    historicalCandles: readonly BacktestCandle[],
    params: StrategyParameters,
    features: IntelligenceFeatures,
  ): { action: BacktestAction; confidence: number } {
    const currentPrice = closedPrices[closedPrices.length - 1];
    const fastEma = calculateEMA(closedPrices, params.emaFastPeriod);
    const slowEma = calculateEMA(closedPrices, params.emaSlowPeriod);
    const rsi = calculateRSI(closedPrices, 14);

    let longScore = 50;
    let shortScore = 50;

    // 1. Trend alignment
    if (fastEma > slowEma) {
      longScore += 15;
      shortScore -= 15;
    } else if (fastEma < slowEma) {
      shortScore += 15;
      longScore -= 15;
    }

    // 2. Price relative to fast EMA
    if (currentPrice > fastEma) {
      longScore += 5;
    } else if (currentPrice < fastEma) {
      shortScore += 5;
    }

    // 3. RSI triggers
    if (rsi <= params.rsiLongThreshold) {
      longScore += 20;
      if (rsi < 30) longScore += 5; // oversold bonus
    }
    if (rsi >= params.rsiShortThreshold) {
      shortScore += 20;
      if (rsi > 70) shortScore += 5; // overbought bonus
    }

    // 4. Feature Flag modifiers (strictly using past historical candles)
    if (features.multiTimeframe) {
      // Check longer-period EMA trend if sufficient historical data exists
      const htfPeriod = params.emaSlowPeriod * 2;
      if (closedPrices.length >= htfPeriod) {
        const htfEma = calculateEMA(closedPrices, htfPeriod);
        if (currentPrice > htfEma) {
          longScore += 5;
        } else {
          shortScore += 5;
        }
      }
    }

    if (features.whaleIntelligence) {
      // Volume breakout confirmation
      const recentCandles = historicalCandles.slice(-10);
      const volumes = recentCandles
        .map((c) => c.volume ?? 0)
        .filter((v) => v > 0);
      if (volumes.length >= 5) {
        const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        const currentVol =
          historicalCandles[historicalCandles.length - 1].volume ?? 0;
        if (currentVol > avgVol * 1.5) {
          if (fastEma > slowEma) longScore += 5;
          else shortScore += 5;
        }
      }
    }

    if (features.derivatives) {
      // Intra-candle volatility expansion
      const currentCandle = historicalCandles[historicalCandles.length - 1];
      const range = currentCandle.high - currentCandle.low;
      if (range / currentCandle.close > 0.02) {
        if (currentCandle.close > currentCandle.open) longScore += 4;
        else shortScore += 4;
      }
    }

    if (features.macro) {
      // 20-period price momentum
      if (closedPrices.length >= 20) {
        const price20Ago = closedPrices[closedPrices.length - 20];
        if (currentPrice > price20Ago) longScore += 3;
        else shortScore += 3;
      }
    }

    if (features.newsSentiment) {
      // Consecutive closes momentum proxy
      if (closedPrices.length >= 3) {
        const p1 = closedPrices[closedPrices.length - 1];
        const p2 = closedPrices[closedPrices.length - 2];
        const p3 = closedPrices[closedPrices.length - 3];
        if (p1 > p2 && p2 > p3) longScore += 3;
        else if (p1 < p2 && p2 < p3) shortScore += 3;
      }
    }

    // Clamp scores to 0-100
    const clampedLong = Math.min(100, Math.max(0, longScore));
    const clampedShort = Math.min(100, Math.max(0, shortScore));

    if (clampedLong >= params.minConfidence && clampedLong > clampedShort) {
      return { action: "LONG", confidence: clampedLong };
    }
    if (clampedShort >= params.minConfidence && clampedShort > clampedLong) {
      return { action: "SHORT", confidence: clampedShort };
    }

    return {
      action: "HOLD",
      confidence: Math.max(clampedLong, clampedShort),
    };
  }

  private closePosition(
    position: OpenPosition,
    exitPrice: number,
    exitTimestamp: string,
    exitReason: string,
    feeRate: number,
  ): BacktestTrade {
    const entryFee = position.allocatedUsd * feeRate;
    const exitUsd = position.sizeBtc * exitPrice;
    const exitFee = exitUsd * feeRate;

    const grossPnl =
      position.side === "LONG"
        ? (exitPrice - position.entryPrice) * position.sizeBtc
        : (position.entryPrice - exitPrice) * position.sizeBtc;

    const netPnlUsd = grossPnl - entryFee - exitFee;
    const pnlPercent = (netPnlUsd / position.allocatedUsd) * 100;

    return {
      entryTimestamp: position.entryTimestamp,
      exitTimestamp,
      side: position.side,
      entryPrice: Number(position.entryPrice.toFixed(2)),
      exitPrice: Number(exitPrice.toFixed(2)),
      sizeBtc: Number(position.sizeBtc.toFixed(6)),
      pnlUsd: Number(netPnlUsd.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      exitReason,
    };
  }
}

export const backtestService = new BacktestService();
