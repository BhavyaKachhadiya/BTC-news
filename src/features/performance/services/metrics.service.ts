import type {
  SharpeRatioOptions,
  DrawdownDetail,
  EquityCurvePoint,
} from "../types/performance.types";

/**
 * Pure mathematical service for computing portfolio and trading strategy performance metrics.
 * Operates without external side-effects or dependencies.
 */
export class MetricsService {
  /**
   * Calculates the Sharpe Ratio from an array of periodic returns or trade percentage returns.
   *
   * Formula: (mean_return - risk_free_rate) / std_deviation
   *
   * @param returns Array of returns (e.g. 0.05 for +5% or 5.0). Must use consistent units.
   * @param options Configuration for annualization and risk-free hurdle rate.
   * @returns Sharpe ratio rounded to 2 decimal places, or 0 if variance is zero or data insufficient.
   */
  public calculateSharpeRatio(
    returns: readonly number[],
    options: SharpeRatioOptions = {},
  ): number {
    if (!returns || returns.length < 2) {
      return 0;
    }

    const {
      riskFreeRate = 0,
      periodsPerYear = 365,
      annualize = false,
    } = options;

    const count = returns.length;
    const sum = returns.reduce((acc, val) => acc + val, 0);
    const mean = sum / count;

    // Sample variance (divided by N - 1)
    const varianceSum = returns.reduce((acc, val) => {
      const diff = val - mean;
      return acc + diff * diff;
    }, 0);

    const sampleVariance = varianceSum / (count - 1);
    if (sampleVariance <= 1e-12) {
      return 0;
    }

    const stdDev = Math.sqrt(sampleVariance);

    if (stdDev < 1e-8 || !Number.isFinite(stdDev)) {
      return 0;
    }

    if (annualize) {
      const periodicRf = riskFreeRate / periodsPerYear;
      const annualizedSharpe =
        ((mean - periodicRf) / stdDev) * Math.sqrt(periodsPerYear);
      return Number(annualizedSharpe.toFixed(2));
    }

    const sharpe = (mean - riskFreeRate) / stdDev;
    return Number(sharpe.toFixed(2));
  }

  /**
   * Calculates the Maximum Drawdown as a positive percentage from a sequential equity curve.
   *
   * Formula: Max over t of (Peak_t - Equity_t) / Peak_t * 100
   *
   * @param equitySeries Sequential portfolio equity values.
   * @returns Max drawdown percentage (e.g. 14.5 for 14.5%), rounded to 2 decimal places.
   */
  public calculateMaxDrawdown(equitySeries: readonly number[]): number {
    if (!equitySeries || equitySeries.length === 0) {
      return 0;
    }

    let peak = equitySeries[0];
    let maxDrawdown = 0;

    for (let i = 0; i < equitySeries.length; i++) {
      const current = equitySeries[i];
      if (current > peak) {
        peak = current;
      } else if (peak > 0) {
        const drawdown = ((peak - current) / peak) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }

    return Number(maxDrawdown.toFixed(2));
  }

  /**
   * Computes detailed drawdown metrics including peak, trough indices, and current drawdown.
   */
  public calculateDrawdownDetails(equitySeries: readonly number[]): DrawdownDetail {
    if (!equitySeries || equitySeries.length === 0) {
      return {
        maxDrawdownPercent: 0,
        peakIndex: 0,
        troughIndex: 0,
        currentDrawdownPercent: 0,
      };
    }

    let peak = equitySeries[0];
    let peakIndex = 0;
    let maxDrawdownPercent = 0;
    let maxPeakIndex = 0;
    let maxTroughIndex = 0;

    for (let i = 0; i < equitySeries.length; i++) {
      const current = equitySeries[i];
      if (current > peak) {
        peak = current;
        peakIndex = i;
      } else if (peak > 0) {
        const drawdown = ((peak - current) / peak) * 100;
        if (drawdown > maxDrawdownPercent) {
          maxDrawdownPercent = drawdown;
          maxPeakIndex = peakIndex;
          maxTroughIndex = i;
        }
      }
    }

    const lastEquity = equitySeries[equitySeries.length - 1];
    const currentDrawdownPercent =
      peak > 0 ? Math.max(0, ((peak - lastEquity) / peak) * 100) : 0;

    return {
      maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
      peakIndex: maxPeakIndex,
      troughIndex: maxTroughIndex,
      currentDrawdownPercent: Number(currentDrawdownPercent.toFixed(2)),
    };
  }

  /**
   * Calculates the Profit Factor from a series of trades.
   *
   * Formula: Gross Profits / Gross Losses
   *
   * @param trades Collection of trades with realized pnlUsd.
   * @returns Profit factor ratio (Infinity if no losses and profit > 0, 0 if no profit).
   */
  public calculateProfitFactor(
    trades: readonly { readonly pnlUsd: number }[],
  ): number {
    if (!trades || trades.length === 0) {
      return 0;
    }

    let grossProfit = 0;
    let grossLoss = 0;

    for (const trade of trades) {
      if (trade.pnlUsd > 0) {
        grossProfit += trade.pnlUsd;
      } else if (trade.pnlUsd < 0) {
        grossLoss += Math.abs(trade.pnlUsd);
      }
    }

    if (grossLoss === 0) {
      return grossProfit > 0 ? Infinity : 0;
    }

    return Number((grossProfit / grossLoss).toFixed(2));
  }

  /**
   * Calculates the percentage of winning trades.
   *
   * @param winningTrades Count of profitable trades.
   * @param totalTrades Total count of closed trades.
   * @returns Win rate percentage from 0 to 100.
   */
  public calculateWinRate(winningTrades: number, totalTrades: number): number {
    if (totalTrades <= 0) {
      return 0;
    }
    const rate = (winningTrades / totalTrades) * 100;
    return Number(rate.toFixed(2));
  }

  /**
   * Calculates total percentage return over an investment period.
   *
   * Formula: (finalBalance - initialBalance) / initialBalance * 100
   */
  public calculateTotalReturnPercent(
    initialBalance: number,
    finalBalance: number,
  ): number {
    if (initialBalance <= 0) {
      return 0;
    }
    const ret = ((finalBalance - initialBalance) / initialBalance) * 100;
    return Number(ret.toFixed(2));
  }

  /**
   * Constructs an equity curve from trade outcomes and an initial balance.
   */
  public calculateEquityCurve(
    initialBalance: number,
    trades: readonly { readonly timestamp: string; readonly pnlUsd: number }[],
    initialTimestamp?: string,
  ): EquityCurvePoint[] {
    const startTimestamp =
      initialTimestamp ??
      (trades.length > 0 ? trades[0].timestamp : new Date().toISOString());

    const curve: EquityCurvePoint[] = [
      {
        timestamp: startTimestamp,
        equity: Number(initialBalance.toFixed(2)),
      },
    ];

    let currentEquity = initialBalance;
    for (const trade of trades) {
      currentEquity += trade.pnlUsd;
      curve.push({
        timestamp: trade.timestamp,
        equity: Number(currentEquity.toFixed(2)),
      });
    }

    return curve;
  }
}

export const metricsService = new MetricsService();
