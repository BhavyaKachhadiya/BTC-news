import { backtestService } from "@/features/backtesting/services/backtest.service";
import type { BacktestCandle, BacktestConfig } from "@/features/backtesting/types/backtest.types";
import type {
  StrategyParameters,
  ParameterSweepConfig,
  ParameterSweepResult,
} from "../types/strategy.types";
import { DEFAULT_STRATEGY_PARAMETERS } from "../types/strategy.types";
import { defaultIntelligenceFeatures } from "@/config/features";

export class ParameterSweepService {
  /**
   * Runs parameter sweeps across specified ranges and evaluates strategy outcomes.
   *
   * @param sweepConfig Ranges for strategy parameters to sweep.
   * @param candles Historical candle series.
   * @param baseConfig Optional base overrides for initialBalance, fees, and feature flags.
   * @returns Array of ranked results ordered by Sharpe Ratio and Total Return.
   */
  public runSweep(
    sweepConfig: ParameterSweepConfig,
    candles: readonly BacktestCandle[],
    baseConfig: Partial<BacktestConfig> = {},
  ): ParameterSweepResult[] {
    const combinations = this.generateCombinations(
      sweepConfig,
      DEFAULT_STRATEGY_PARAMETERS,
    );

    const initialBalance = baseConfig.initialBalance ?? 10000;
    const feeBps = baseConfig.feeBps ?? 10;
    const featureFlags =
      baseConfig.featureFlags ?? defaultIntelligenceFeatures;
    const startDate = baseConfig.startDate ?? "";
    const endDate = baseConfig.endDate ?? "";

    const results: ParameterSweepResult[] = [];

    for (const params of combinations) {
      const config: BacktestConfig = {
        startDate,
        endDate,
        initialBalance,
        feeBps,
        strategyParams: params,
        featureFlags,
      };

      const backtestResult = backtestService.runBacktest(config, candles);

      results.push({
        rank: 0,
        parameters: params,
        totalTrades: backtestResult.totalTrades,
        winRate: backtestResult.winRate,
        totalReturnPercent: backtestResult.totalReturnPercent,
        maxDrawdownPercent: backtestResult.maxDrawdownPercent,
        sharpeRatio: backtestResult.sharpeRatio,
        profitFactor: backtestResult.profitFactor,
      });
    }

    // Sort by Sharpe Ratio descending, then Total Return descending
    results.sort((a, b) => {
      if (b.sharpeRatio !== a.sharpeRatio) {
        return b.sharpeRatio - a.sharpeRatio;
      }
      return b.totalReturnPercent - a.totalReturnPercent;
    });

    // Assign rank 1-indexed
    return results.map((res, index) => ({
      ...res,
      rank: index + 1,
    }));
  }

  private generateCombinations(
    sweepConfig: ParameterSweepConfig,
    baseParams: StrategyParameters,
  ): StrategyParameters[] {
    const rsiLongs = sweepConfig.ranges.rsiLongThresholds?.length
      ? sweepConfig.ranges.rsiLongThresholds
      : [baseParams.rsiLongThreshold];

    const rsiShorts = sweepConfig.ranges.rsiShortThresholds?.length
      ? sweepConfig.ranges.rsiShortThresholds
      : [baseParams.rsiShortThreshold];

    const fastEmas = sweepConfig.ranges.emaFastPeriods?.length
      ? sweepConfig.ranges.emaFastPeriods
      : [baseParams.emaFastPeriod];

    const slowEmas = sweepConfig.ranges.emaSlowPeriods?.length
      ? sweepConfig.ranges.emaSlowPeriods
      : [baseParams.emaSlowPeriod];

    const confidences = sweepConfig.ranges.minConfidences?.length
      ? sweepConfig.ranges.minConfidences
      : [baseParams.minConfidence];

    const stopLosses = sweepConfig.ranges.stopLossPercents?.length
      ? sweepConfig.ranges.stopLossPercents
      : [baseParams.stopLossPercent];

    const takeProfits = sweepConfig.ranges.takeProfitPercents?.length
      ? sweepConfig.ranges.takeProfitPercents
      : [baseParams.takeProfitPercent];

    const maxLimit = sweepConfig.maxCombinations ?? 50;
    const combinations: StrategyParameters[] = [];

    for (const rsiLong of rsiLongs) {
      for (const rsiShort of rsiShorts) {
        for (const fastEma of fastEmas) {
          for (const slowEma of slowEmas) {
            if (fastEma >= slowEma) continue; // Fast EMA must be smaller than Slow EMA
            for (const minConf of confidences) {
              for (const sl of stopLosses) {
                for (const tp of takeProfits) {
                  combinations.push({
                    rsiLongThreshold: rsiLong,
                    rsiShortThreshold: rsiShort,
                    emaFastPeriod: fastEma,
                    emaSlowPeriod: slowEma,
                    minConfidence: minConf,
                    stopLossPercent: sl,
                    takeProfitPercent: tp,
                  });

                  if (combinations.length >= maxLimit) {
                    return combinations;
                  }
                }
              }
            }
          }
        }
      }
    }

    return combinations;
  }
}

export const parameterSweepService = new ParameterSweepService();
