export interface SharpeRatioOptions {
  /** Annual risk-free rate (e.g. 0.04 for 4%). Defaults to 0. */
  readonly riskFreeRate?: number;
  /** Number of periods in a trading year (e.g. 365 for crypto 24/7, 252 for equities). Defaults to 365. */
  readonly periodsPerYear?: number;
  /** Whether to annualize the Sharpe ratio. Defaults to false (per-trade/per-period ratio). */
  readonly annualize?: boolean;
}

export interface DrawdownDetail {
  readonly maxDrawdownPercent: number;
  readonly peakIndex: number;
  readonly troughIndex: number;
  readonly currentDrawdownPercent: number;
}

export interface PerformanceMetrics {
  readonly totalTrades: number;
  readonly winningTrades: number;
  readonly losingTrades: number;
  readonly winRate: number;
  readonly totalReturnPercent: number;
  readonly maxDrawdownPercent: number;
  readonly sharpeRatio: number;
  readonly profitFactor: number;
}

export interface EquityCurvePoint {
  readonly timestamp: string;
  readonly equity: number;
}
