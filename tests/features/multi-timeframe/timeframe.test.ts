import { describe, it, expect } from "vitest";
import {
  determineTimeframeTrend,
  toBinanceInterval,
  SUPPORTED_TIMEFRAMES,
  timeframeService,
} from "@/features/multi-timeframe/services/timeframe.service";
import { computeMultiTimeframeAlignment } from "@/features/multi-timeframe/services/alignment.service";
import {
  binanceRawKlineSchema,
  timeframeAnalysisSchema,
  multiTimeframeAlignmentSchema,
} from "@/features/multi-timeframe/schemas/timeframe.schema";
import type {
  TimeframeAnalysis,
  BinanceKlineBar,
} from "@/features/multi-timeframe/types/timeframe.types";

describe("Multi-Timeframe Feature", () => {
  describe("Interval mapping & constants", () => {
    it("correctly maps internal Timeframe representations to Binance interval strings", () => {
      expect(toBinanceInterval("5m")).toBe("5m");
      expect(toBinanceInterval("15m")).toBe("15m");
      expect(toBinanceInterval("1h")).toBe("1h");
      expect(toBinanceInterval("4h")).toBe("4h");
      expect(toBinanceInterval("1D")).toBe("1d");
    });

    it("supports exactly 5 canonical timeframes", () => {
      expect(SUPPORTED_TIMEFRAMES).toEqual(["5m", "15m", "1h", "4h", "1D"]);
    });
  });

  describe("determineTimeframeTrend", () => {
    it("identifies bullish trend when price > ema20 > ema50 and RSI is healthy", () => {
      const trend = determineTimeframeTrend({
        price: 95000,
        rsi: 62,
        ema20: 93000,
        ema50: 90000,
      });
      expect(trend).toBe("bullish");
    });

    it("identifies bearish trend when price < ema20 < ema50 and RSI is low", () => {
      const trend = determineTimeframeTrend({
        price: 85000,
        rsi: 38,
        ema20: 88000,
        ema50: 91000,
      });
      expect(trend).toBe("bearish");
    });

    it("classifies momentum divergence as uncertain when price is high but RSI is collapsing", () => {
      const trend = determineTimeframeTrend({
        price: 95000,
        rsi: 35, // Momentum divergence
        ema20: 93000,
        ema50: 90000,
      });
      expect(trend).toBe("uncertain");
    });

    it("classifies momentum divergence as uncertain when price is low but RSI is surging", () => {
      const trend = determineTimeframeTrend({
        price: 85000,
        rsi: 65, // Momentum divergence
        ema20: 88000,
        ema50: 91000,
      });
      expect(trend).toBe("uncertain");
    });

    it("classifies market as ranging when price is between EMA20 and EMA50", () => {
      const trend = determineTimeframeTrend({
        price: 91500, // Inside [90000, 93000]
        rsi: 50,
        ema20: 93000,
        ema50: 90000,
      });
      expect(trend).toBe("ranging");
    });

    it("classifies market as ranging when EMAs are tightly compressed", () => {
      const trend = determineTimeframeTrend({
        price: 90050,
        rsi: 48,
        ema20: 90000,
        ema50: 90100, // ~0.11% spread
      });
      expect(trend).toBe("ranging");
    });

    it("classifies neutral RSI consolidation as ranging", () => {
      const trend = determineTimeframeTrend({
        price: 92000,
        rsi: 50,
        ema20: 91000,
        ema50: 91500,
      });
      expect(trend).toBe("ranging");
    });
  });

  describe("computeMultiTimeframeAlignment", () => {
    const makeAnalysis = (
      timeframe: "5m" | "15m" | "1h" | "4h" | "1D",
      trend: "bullish" | "bearish" | "ranging" | "uncertain",
      price = 90000,
    ): TimeframeAnalysis => ({
      timeframe,
      price,
      rsi: trend === "bullish" ? 60 : trend === "bearish" ? 40 : 50,
      ema20: trend === "bullish" ? 89000 : 91000,
      ema50: trend === "bullish" ? 88000 : 92000,
      atr: 1200,
      volatility: 2.5,
      trend,
    });

    it("returns 'aligned bullish' when all 5 timeframes are bullish", () => {
      const analyses: TimeframeAnalysis[] = [
        makeAnalysis("5m", "bullish"),
        makeAnalysis("15m", "bullish"),
        makeAnalysis("1h", "bullish"),
        makeAnalysis("4h", "bullish"),
        makeAnalysis("1D", "bullish"),
      ];

      const alignment = computeMultiTimeframeAlignment(analyses);
      expect(alignment.alignmentStatus).toBe("aligned bullish");
      expect(alignment.overallTrend).toBe("bullish");
      expect(alignment.alignedCount).toBe(5);
    });

    it("returns 'aligned bullish' when 4 timeframes are bullish and 0 are bearish", () => {
      const analyses: TimeframeAnalysis[] = [
        makeAnalysis("5m", "bullish"),
        makeAnalysis("15m", "bullish"),
        makeAnalysis("1h", "bullish"),
        makeAnalysis("4h", "bullish"),
        makeAnalysis("1D", "ranging"),
      ];

      const alignment = computeMultiTimeframeAlignment(analyses);
      expect(alignment.alignmentStatus).toBe("aligned bullish");
      expect(alignment.overallTrend).toBe("bullish");
      expect(alignment.alignedCount).toBe(4);
    });

    it("returns 'aligned bearish' when all 5 timeframes are bearish", () => {
      const analyses: TimeframeAnalysis[] = [
        makeAnalysis("5m", "bearish"),
        makeAnalysis("15m", "bearish"),
        makeAnalysis("1h", "bearish"),
        makeAnalysis("4h", "bearish"),
        makeAnalysis("1D", "bearish"),
      ];

      const alignment = computeMultiTimeframeAlignment(analyses);
      expect(alignment.alignmentStatus).toBe("aligned bearish");
      expect(alignment.overallTrend).toBe("bearish");
      expect(alignment.alignedCount).toBe(5);
    });

    it("returns 'aligned bearish' when 4 timeframes are bearish and 0 are bullish", () => {
      const analyses: TimeframeAnalysis[] = [
        makeAnalysis("5m", "bearish"),
        makeAnalysis("15m", "bearish"),
        makeAnalysis("1h", "bearish"),
        makeAnalysis("4h", "bearish"),
        makeAnalysis("1D", "uncertain"),
      ];

      const alignment = computeMultiTimeframeAlignment(analyses);
      expect(alignment.alignmentStatus).toBe("aligned bearish");
      expect(alignment.overallTrend).toBe("bearish");
      expect(alignment.alignedCount).toBe(4);
    });

    it("detects 'transitioning' when lower timeframes (5m, 15m) reverse against higher timeframes (4h, 1D)", () => {
      const analyses: TimeframeAnalysis[] = [
        makeAnalysis("5m", "bullish"),
        makeAnalysis("15m", "bullish"),
        makeAnalysis("1h", "ranging"),
        makeAnalysis("4h", "bearish"),
        makeAnalysis("1D", "bearish"),
      ];

      const alignment = computeMultiTimeframeAlignment(analyses);
      expect(alignment.alignmentStatus).toBe("transitioning");
      expect(alignment.overallTrend).toBe("bearish"); // Anchored by HTF
    });

    it("detects 'transitioning' when short-term breaks down against higher timeframe uptrend", () => {
      const analyses: TimeframeAnalysis[] = [
        makeAnalysis("5m", "bearish"),
        makeAnalysis("15m", "bearish"),
        makeAnalysis("1h", "bullish"),
        makeAnalysis("4h", "bullish"),
        makeAnalysis("1D", "bullish"),
      ];

      const alignment = computeMultiTimeframeAlignment(analyses);
      expect(alignment.alignmentStatus).toBe("transitioning");
      expect(alignment.overallTrend).toBe("bullish"); // 3 bullish vs 2 bearish
      expect(alignment.alignedCount).toBe(3);
    });

    it("detects 'uncertain' when ranging or uncertain conditions dominate (>= 3)", () => {
      const analyses: TimeframeAnalysis[] = [
        makeAnalysis("5m", "ranging"),
        makeAnalysis("15m", "ranging"),
        makeAnalysis("1h", "ranging"),
        makeAnalysis("4h", "bullish"),
        makeAnalysis("1D", "uncertain"),
      ];

      const alignment = computeMultiTimeframeAlignment(analyses);
      expect(alignment.alignmentStatus).toBe("uncertain");
      expect(alignment.overallTrend).toBe("ranging");
      expect(alignment.alignedCount).toBe(3);
    });

    it("detects 'mixed' when conflicting signals do not cleanly form a transition", () => {
      const analyses: TimeframeAnalysis[] = [
        makeAnalysis("5m", "bullish"),
        makeAnalysis("15m", "bearish"),
        makeAnalysis("1h", "bullish"),
        makeAnalysis("4h", "bearish"),
        makeAnalysis("1D", "ranging"),
      ];

      const alignment = computeMultiTimeframeAlignment(analyses);
      expect(alignment.alignmentStatus).toBe("mixed");
    });

    it("handles empty or missing analyses safely", () => {
      const alignment = computeMultiTimeframeAlignment([]);
      expect(alignment.alignmentStatus).toBe("uncertain");
      expect(alignment.overallTrend).toBe("uncertain");
      expect(alignment.alignedCount).toBe(0);
      expect(alignment.timeframes).toHaveLength(0);
    });
  });

  describe("analyzeKlines", () => {
    it("computes RSI, EMA20, EMA50, ATR, Volatility from synthetic klines", () => {
      // Generate 60 synthetic bars with steady upward trend
      const bars: BinanceKlineBar[] = [];
      let basePrice = 80000;
      for (let i = 0; i < 60; i++) {
        basePrice += 100;
        bars.push({
          openTime: 1700000000000 + i * 60000,
          open: basePrice - 20,
          high: basePrice + 50,
          low: basePrice - 40,
          close: basePrice,
          volume: 15.5,
          closeTime: 1700000000000 + (i + 1) * 60000 - 1,
        });
      }

      const result = timeframeService.analyzeKlines("1h", bars);
      expect(result.timeframe).toBe("1h");
      expect(result.price).toBe(basePrice);
      expect(result.rsi).toBeGreaterThan(50);
      expect(result.ema20).toBeGreaterThan(0);
      expect(result.ema50).toBeGreaterThan(0);
      expect(result.atr).toBeGreaterThan(0);
      expect(result.volatility).toBeGreaterThanOrEqual(0);
      expect(result.trend).toBe("bullish");
    });

    it("throws ValidationError when insufficient klines are provided (< 20)", () => {
      const bars: BinanceKlineBar[] = [
        {
          openTime: 1700000000000,
          open: 80000,
          high: 80100,
          low: 79900,
          close: 80050,
          volume: 10,
          closeTime: 1700000060000,
        },
      ];

      expect(() => timeframeService.analyzeKlines("5m", bars)).toThrow();
    });
  });

  describe("Schema Validation", () => {
    it("validates a raw Binance kline tuple", () => {
      const rawTuple = [
        1700000000000,
        "84043.96",
        "84512.00",
        "84028.98",
        "84417.06",
        "686.85",
        1700000059999,
        "57858810.58",
        85249,
        "441.43",
        "37181781.29",
        "0",
      ];
      const parsed = binanceRawKlineSchema.safeParse(rawTuple);
      expect(parsed.success).toBe(true);
    });

    it("validates a full TimeframeAnalysis object", () => {
      const analysis: TimeframeAnalysis = {
        timeframe: "15m",
        price: 94250.5,
        rsi: 58.4,
        ema20: 93800.2,
        ema50: 92900.0,
        atr: 450.75,
        volatility: 1.85,
        trend: "bullish",
      };
      const parsed = timeframeAnalysisSchema.safeParse(analysis);
      expect(parsed.success).toBe(true);
    });

    it("validates MultiTimeframeAlignment schema", () => {
      const alignment = {
        overallTrend: "bullish",
        alignedCount: 5,
        alignmentStatus: "aligned bullish",
        timeframes: [
          {
            timeframe: "5m",
            price: 94250,
            rsi: 60,
            ema20: 94000,
            ema50: 93500,
            atr: 300,
            volatility: 1.5,
            trend: "bullish",
          },
        ],
      };
      const parsed = multiTimeframeAlignmentSchema.safeParse(alignment);
      expect(parsed.success).toBe(true);
    });
  });
});
