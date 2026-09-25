import { describe, it, expect } from "vitest";
import { calculateRSI } from "@/features/technical-analysis/indicators/rsi";
import { calculateEMA } from "@/features/technical-analysis/indicators/ema";
import { calculateSMA } from "@/features/technical-analysis/indicators/sma";
import { calculateATR, synthesizeBarsFromPrices } from "@/features/technical-analysis/indicators/atr";
import { calculateVolatility } from "@/features/technical-analysis/indicators/volatility";
import { technicalAnalysisService } from "@/features/technical-analysis/services/technical-analysis.service";
import { IndicatorError } from "@/shared/errors/app-error";

describe("Technical Analysis Feature", () => {
  const upwardPrices = Array.from({ length: 30 }, (_, i) => 50000 + i * 200);
  const downwardPrices = Array.from({ length: 30 }, (_, i) => 50000 - i * 200);
  const fluctuatingPrices = [
    50000, 50200, 49800, 50300, 50100, 50500, 50200, 50700, 50400, 50900,
    50600, 51000, 50800, 51200, 51000, 51500, 51200, 51400, 51100, 51600,
    51300, 51700, 51400, 51800, 51500, 52000, 51700, 52100, 51900, 52300,
  ];

  describe("RSI", () => {
    it("returns 100 for strictly rising prices", () => {
      const rsi = calculateRSI(upwardPrices, 14);
      expect(rsi).toBe(100);
    });

    it("returns 0 for strictly falling prices", () => {
      const rsi = calculateRSI(downwardPrices, 14);
      expect(rsi).toBe(0);
    });

    it("calculates balanced RSI within bounds for fluctuating prices", () => {
      const rsi = calculateRSI(fluctuatingPrices, 14);
      expect(rsi).toBeGreaterThan(40);
      expect(rsi).toBeLessThan(80);
    });

    it("throws IndicatorError when price count is insufficient", () => {
      expect(() => calculateRSI([100, 105, 110], 14)).toThrow(IndicatorError);
    });
  });

  describe("SMA & EMA", () => {
    it("calculates SMA accurately", () => {
      const prices = [10, 20, 30, 40, 50];
      const sma = calculateSMA(prices, 5);
      expect(sma).toBe(30);
    });

    it("calculates EMA with higher weighting on recent prices", () => {
      const prices = [10, 10, 10, 10, 10, 50];
      const sma = calculateSMA(prices, 5);
      const ema = calculateEMA(prices, 5);
      // Because price jumped to 50 at the end, EMA reacts faster than SMA
      expect(ema).toBeGreaterThan(sma);
    });
  });

  describe("ATR & Volatility", () => {
    it("computes non-negative ATR", () => {
      const bars = synthesizeBarsFromPrices(fluctuatingPrices);
      const atr = calculateATR(bars, 14);
      expect(atr).toBeGreaterThan(0);
    });

    it("calculates volatility percentage", () => {
      const vol = calculateVolatility(fluctuatingPrices, 14);
      expect(vol).toBeGreaterThan(0);
      expect(vol).toBeLessThan(50);
    });
  });

  describe("TechnicalAnalysisService", () => {
    it("orchestrates all indicators into a valid TechnicalState", () => {
      const state = technicalAnalysisService.analyze({ prices: fluctuatingPrices });
      expect(state.rsi14).toBeDefined();
      expect(state.ema20).toBeDefined();
      expect(state.ema50).toBeDefined();
      expect(state.sma20).toBeDefined();
      expect(state.atr14).toBeDefined();
      expect(state.volatility).toBeDefined();
      expect(state.currentPrice).toBe(52300);
    });
  });
});
