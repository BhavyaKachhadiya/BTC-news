export interface StrategyParameters {
  readonly rsiLongThreshold: number;
  readonly rsiShortThreshold: number;
  readonly emaFastPeriod: number;
  readonly emaSlowPeriod: number;
  readonly minConfidence: number;
  readonly stopLossPercent: number;
  readonly takeProfitPercent: number;
}

export type StrategyPresetKey =
  | "trend_following"
  | "mean_reversion"
  | "conservative"
  | "aggressive";

export interface StrategyPreset {
  readonly id: StrategyPresetKey;
  readonly name: string;
  readonly description: string;
  readonly parameters: StrategyParameters;
}

export const STRATEGY_PRESETS: Record<StrategyPresetKey, StrategyPreset> = {
  trend_following: {
    id: "trend_following",
    name: "Trend Following",
    description: "Aligns with intermediate EMA trends and enters on momentum pullbacks.",
    parameters: {
      rsiLongThreshold: 55,
      rsiShortThreshold: 45,
      emaFastPeriod: 12,
      emaSlowPeriod: 26,
      minConfidence: 70,
      stopLossPercent: 2.5,
      takeProfitPercent: 6.0,
    },
  },
  mean_reversion: {
    id: "mean_reversion",
    name: "Mean Reversion",
    description: "Capitalizes on oversold bounce and overbought exhaustion extremes.",
    parameters: {
      rsiLongThreshold: 30,
      rsiShortThreshold: 70,
      emaFastPeriod: 20,
      emaSlowPeriod: 50,
      minConfidence: 65,
      stopLossPercent: 2.0,
      takeProfitPercent: 4.0,
    },
  },
  conservative: {
    id: "conservative",
    name: "Conservative",
    description: "High confidence hurdle with tight risk controls and lower trade frequency.",
    parameters: {
      rsiLongThreshold: 35,
      rsiShortThreshold: 65,
      emaFastPeriod: 20,
      emaSlowPeriod: 50,
      minConfidence: 80,
      stopLossPercent: 1.5,
      takeProfitPercent: 3.0,
    },
  },
  aggressive: {
    id: "aggressive",
    name: "Aggressive",
    description: "Fast reactivity with wider profit targets and looser confidence gates.",
    parameters: {
      rsiLongThreshold: 45,
      rsiShortThreshold: 55,
      emaFastPeriod: 9,
      emaSlowPeriod: 21,
      minConfidence: 55,
      stopLossPercent: 3.5,
      takeProfitPercent: 8.0,
    },
  },
};

export const DEFAULT_STRATEGY_PARAMETERS: StrategyParameters =
  STRATEGY_PRESETS.trend_following.parameters;

export interface ParameterSweepRange {
  readonly rsiLongThresholds?: readonly number[];
  readonly rsiShortThresholds?: readonly number[];
  readonly emaFastPeriods?: readonly number[];
  readonly emaSlowPeriods?: readonly number[];
  readonly minConfidences?: readonly number[];
  readonly stopLossPercents?: readonly number[];
  readonly takeProfitPercents?: readonly number[];
}

export interface ParameterSweepConfig {
  readonly ranges: ParameterSweepRange;
  readonly maxCombinations?: number;
}

export interface ParameterSweepResult {
  readonly rank: number;
  readonly parameters: StrategyParameters;
  readonly totalTrades: number;
  readonly winRate: number;
  readonly totalReturnPercent: number;
  readonly maxDrawdownPercent: number;
  readonly sharpeRatio: number;
  readonly profitFactor: number;
}
