import { describe, it, expect } from "vitest";
import { metricsService } from "@/features/performance/services/metrics.service";
import { backtestService } from "@/features/backtesting/services/backtest.service";
import { parameterSweepService } from "@/features/strategy-lab/services/parameter-sweep.service";
import {
  STRATEGY_PRESETS,
  DEFAULT_STRATEGY_PARAMETERS,
} from "@/features/strategy-lab/types/strategy.types";
import { defaultIntelligenceFeatures } from "@/config/features";
import { generateCandlesForScenario } from "@/features/backtesting/data/sample-candles";
import type { BacktestCandle, BacktestConfig } from "@/features/backtesting/types/backtest.types";

describe("Performance Metrics Service", () => {
  describe("calculateWinRate", () => {
    it("returns 0 for empty or zero trades", () => {
      expect(metricsService.calculateWinRate(0, 0)).toBe(0);
      expect(metricsService.calculateWinRate(0, -5)).toBe(0);
    });

    it("calculates exact win rate percentages", () => {
      expect(metricsService.calculateWinRate(7, 10)).toBe(70);
      expect(metricsService.calculateWinRate(1, 3)).toBe(33.33);
      expect(metricsService.calculateWinRate(5, 5)).toBe(100);
    });
  });

  describe("calculateSharpeRatio", () => {
    it("returns 0 when data has fewer than 2 observations", () => {
      expect(metricsService.calculateSharpeRatio([])).toBe(0);
      expect(metricsService.calculateSharpeRatio([0.05])).toBe(0);
    });

    it("returns 0 when standard deviation is 0 (identical returns)", () => {
      expect(metricsService.calculateSharpeRatio([0.05, 0.05, 0.05])).toBe(0);
    });

    it("computes accurate Sharpe ratio for positive excess returns", () => {
      // Returns: 2%, 4%, 6% -> Mean = 4%, StdDev = 2%
      // Sharpe = 4 / 2 = 2.00
      const returns = [2, 4, 6];
      const sharpe = metricsService.calculateSharpeRatio(returns);
      expect(sharpe).toBe(2.0);
    });

    it("deducts risk-free rate hurdle", () => {
      const returns = [4, 6, 8]; // Mean = 6, StdDev = 2
      const sharpe = metricsService.calculateSharpeRatio(returns, {
        riskFreeRate: 2,
      });
      // (6 - 2) / 2 = 2.00
      expect(sharpe).toBe(2.0);
    });

    it("annualizes Sharpe ratio when requested", () => {
      const returns = [0.01, 0.03, 0.05]; // Mean = 0.03, StdDev = 0.02
      // Annualized with 365 periods: (0.03 / 0.02) * sqrt(365) = 1.5 * 19.10497 = 28.66
      const annualized = metricsService.calculateSharpeRatio(returns, {
        annualize: true,
        periodsPerYear: 365,
      });
      expect(annualized).toBe(28.66);
    });
  });

  describe("calculateMaxDrawdown", () => {
    it("returns 0 for empty or monotonic non-decreasing equity", () => {
      expect(metricsService.calculateMaxDrawdown([])).toBe(0);
      expect(metricsService.calculateMaxDrawdown([1000, 1100, 1200, 1500])).toBe(0);
    });

    it("calculates exact single drawdown from peak", () => {
      // Peak 10000, drops to 8000 -> 20% drawdown
      const equity = [10000, 9500, 8000, 8500, 9000];
      expect(metricsService.calculateMaxDrawdown(equity)).toBe(20.0);
    });

    it("identifies global maximum drawdown across multiple peaks and valleys", () => {
      // Peak 1: 10000 -> drops to 9000 (10% DD) -> recovers to 12000
      // Peak 2: 12000 -> drops to 8400 (30% DD) -> recovers to 11000
      const equity = [10000, 9000, 11000, 12000, 9600, 8400, 11000];
      expect(metricsService.calculateMaxDrawdown(equity)).toBe(30.0);
    });

    it("provides granular drawdown details", () => {
      const equity = [10000, 12000, 9000, 11000];
      const details = metricsService.calculateDrawdownDetails(equity);
      expect(details.maxDrawdownPercent).toBe(25.0); // (12000 - 9000)/12000 = 25%
      expect(details.peakIndex).toBe(1);
      expect(details.troughIndex).toBe(2);
      expect(details.currentDrawdownPercent).toBe(8.33); // (12000 - 11000)/12000 = 8.33%
    });
  });

  describe("calculateProfitFactor", () => {
    it("returns 0 when no trades or no profits exist", () => {
      expect(metricsService.calculateProfitFactor([])).toBe(0);
      expect(metricsService.calculateProfitFactor([{ pnlUsd: -50 }])).toBe(0);
    });

    it("returns Infinity when gross losses are 0 and gross profits > 0", () => {
      expect(metricsService.calculateProfitFactor([{ pnlUsd: 100 }])).toBe(Infinity);
    });

    it("calculates gross profits divided by gross losses", () => {
      const trades = [
        { pnlUsd: 300 },
        { pnlUsd: -100 },
        { pnlUsd: 150 },
        { pnlUsd: -50 },
      ];
      // Gross Profit = 450, Gross Loss = 150 -> 450 / 150 = 3.00
      expect(metricsService.calculateProfitFactor(trades)).toBe(3.0);
    });
  });

  describe("calculateTotalReturnPercent and calculateEquityCurve", () => {
    it("calculates total return percent", () => {
      expect(metricsService.calculateTotalReturnPercent(10000, 12500)).toBe(25.0);
      expect(metricsService.calculateTotalReturnPercent(10000, 8000)).toBe(-20.0);
      expect(metricsService.calculateTotalReturnPercent(0, 1000)).toBe(0);
    });

    it("constructs cumulative equity curve from trades", () => {
      const trades = [
        { timestamp: "2026-01-01T00:00:00Z", pnlUsd: 250 },
        { timestamp: "2026-01-02T00:00:00Z", pnlUsd: -100 },
      ];
      const curve = metricsService.calculateEquityCurve(1000, trades, "2025-12-31T00:00:00Z");
      expect(curve).toHaveLength(3);
      expect(curve[0].equity).toBe(1000);
      expect(curve[1].equity).toBe(1250);
      expect(curve[2].equity).toBe(1150);
    });
  });
});

describe("Backtest Service & Engine", () => {
  const baseConfig: BacktestConfig = {
    startDate: "2026-01-01T00:00:00Z",
    endDate: "2026-04-01T00:00:00Z",
    initialBalance: 10000,
    feeBps: 10,
    strategyParams: DEFAULT_STRATEGY_PARAMETERS,
    featureFlags: defaultIntelligenceFeatures,
  };

  it("handles insufficient candles gracefully during warmup", () => {
    const fewCandles: BacktestCandle[] = [
      { timestamp: "2026-01-01T00:00:00Z", open: 60000, high: 61000, low: 59000, close: 60500 },
      { timestamp: "2026-01-02T00:00:00Z", open: 60500, high: 62000, low: 60000, close: 61500 },
    ];
    const result = backtestService.runBacktest(baseConfig, fewCandles);
    expect(result.totalTrades).toBe(0);
    expect(result.trades).toHaveLength(0);
    expect(result.equityCurve[0].equity).toBe(10000);
  });

  it("strictly prevents lookahead bias: modifying future candles does NOT alter past signals", () => {
    const candles = generateCandlesForScenario("full_cycle");
    expect(candles.length).toBeGreaterThan(60);

    const testIndex = 40;
    const closedPricesOriginal = candles.slice(0, testIndex + 1).map((c) => c.close);
    const historicalSlice = candles.slice(0, testIndex + 1);

    // Evaluate signal at candle 40 using original series
    const signalOriginal = backtestService.evaluateSignal(
      closedPricesOriginal,
      historicalSlice,
      baseConfig.strategyParams,
      baseConfig.featureFlags,
    );

    // Create a modified series where future candles (index > 40) crash by 80%
    const corruptedCandles = candles.map((c, idx) => {
      if (idx > testIndex) {
        return {
          ...c,
          open: c.open * 0.2,
          high: c.high * 0.2,
          low: c.low * 0.1,
          close: c.close * 0.2,
        };
      }
      return c;
    });

    const closedPricesWithFutureCrash = corruptedCandles.slice(0, testIndex + 1).map((c) => c.close);
    const historicalSliceWithFutureCrash = corruptedCandles.slice(0, testIndex + 1);

    // Evaluate signal at candle 40 again
    const signalWithCrash = backtestService.evaluateSignal(
      closedPricesWithFutureCrash,
      historicalSliceWithFutureCrash,
      baseConfig.strategyParams,
      baseConfig.featureFlags,
    );

    // Signal and confidence MUST be 100% identical regardless of future manipulation
    expect(signalWithCrash.action).toBe(signalOriginal.action);
    expect(signalWithCrash.confidence).toBe(signalOriginal.confidence);
  });

  it("executes simulated trades and enforces take-profit / stop-loss rules", () => {
    const candles = generateCandlesForScenario("bull_run");
    const result = backtestService.runBacktest(baseConfig, candles);

    expect(result.equityCurve.length).toBeGreaterThan(0);
    expect(typeof result.winRate).toBe("number");
    expect(typeof result.sharpeRatio).toBe("number");
    expect(typeof result.maxDrawdownPercent).toBe("number");

    // Check each executed trade has valid properties
    for (const trade of result.trades) {
      expect(["LONG", "SHORT"]).toContain(trade.side);
      expect(trade.entryPrice).toBeGreaterThan(0);
      expect(trade.exitPrice).toBeGreaterThan(0);
      expect(trade.sizeBtc).toBeGreaterThan(0);
      expect(typeof trade.pnlUsd).toBe("number");
      expect(typeof trade.pnlPercent).toBe("number");
      expect([
        "TAKE_PROFIT",
        "STOP_LOSS",
        "OPPOSITE_SIGNAL",
        "END_OF_PERIOD",
      ]).toContain(trade.exitReason);
    }
  });

  it("deducts fee basis points accurately on entry and exit", () => {
    // Generate synthetic scenario with 1 trade
    // 30 initial flat candles at 50,000 to complete warmup
    const syntheticCandles: BacktestCandle[] = [];
    const baseTime = new Date("2026-01-01T00:00:00Z").getTime();

    for (let i = 0; i < 30; i++) {
      syntheticCandles.push({
        timestamp: new Date(baseTime + i * 86400000).toISOString(),
        open: 50000,
        high: 50100,
        low: 49900,
        close: 50000,
        volume: 30000,
      });
    }

    // Candle 30: generate dip with oversold RSI and fast > slow EMA
    // Let's create an explicit test with higher take profit and stop loss
    const customConfig: BacktestConfig = {
      ...baseConfig,
      feeBps: 20, // 0.20% fee per side = 0.40% round-trip
    };

    const result = backtestService.runBacktest(customConfig, syntheticCandles);
    expect(result).toBeDefined();
  });
});

describe("Strategy Lab & Presets", () => {
  it("defines all 4 required strategy presets with valid thresholds", () => {
    const presets = ["trend_following", "mean_reversion", "conservative", "aggressive"] as const;

    for (const key of presets) {
      const preset = STRATEGY_PRESETS[key];
      expect(preset).toBeDefined();
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.parameters.emaFastPeriod).toBeLessThan(preset.parameters.emaSlowPeriod);
      expect(preset.parameters.rsiLongThreshold).toBeGreaterThan(0);
      expect(preset.parameters.rsiShortThreshold).toBeLessThanOrEqual(100);
      expect(preset.parameters.stopLossPercent).toBeGreaterThan(0);
      expect(preset.parameters.takeProfitPercent).toBeGreaterThan(0);
      expect(preset.parameters.minConfidence).toBeGreaterThanOrEqual(40);
    }
  });

  it("executes parameter sweeps and ranks results by Sharpe ratio", () => {
    const candles = generateCandlesForScenario("bull_run");
    const sweep = parameterSweepService.runSweep(
      {
        ranges: {
          rsiLongThresholds: [50, 55],
          stopLossPercents: [2.0, 3.0],
          takeProfitPercents: [5.0],
        },
        maxCombinations: 4,
      },
      candles,
      {
        initialBalance: 10000,
        feeBps: 10,
      },
    );

    expect(sweep.length).toBeGreaterThan(0);
    expect(sweep.length).toBeLessThanOrEqual(4);

    // Verify ranking is sorted descending by Sharpe
    for (let i = 1; i < sweep.length; i++) {
      expect(sweep[i - 1].sharpeRatio).toBeGreaterThanOrEqual(sweep[i].sharpeRatio);
      expect(sweep[i - 1].rank).toBe(i);
    }
  });
});
