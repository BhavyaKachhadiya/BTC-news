import { describe, it, expect } from "vitest";
import { calculateMACD } from "./macd";
import { calculateSupertrend } from "./supertrend";
import { calculateBollingerBands } from "./bollinger";
import { calculateADX } from "./adx";
import { calculateStochastic } from "./stochastic";
import { calculateVWAP } from "./vwap";
import { calculateFibonacciRetracement } from "./fibonacci";
import { calculateIchimoku } from "./ichimoku";
import { calculateCrossovers } from "./crossovers";

describe("Technical Indicators Comprehensive Suite", () => {
  const samplePrices = [
    91000, 91500, 91200, 92000, 92800, 92400, 93100, 93500, 94000, 93800,
    94500, 95000, 94800, 95500, 96000, 95800, 96500, 97000, 96800, 97500,
    98000, 97800, 98500, 99000, 98800, 99500, 100000, 99800, 100500, 101000,
  ];

  it("should calculate valid MACD values", () => {
    const res = calculateMACD(samplePrices);
    expect(res).toBeDefined();
    expect(typeof res.macd).toBe("number");
    expect(typeof res.signal).toBe("number");
    expect(typeof res.histogram).toBe("number");
    expect(Number.isFinite(res.macd)).toBe(true);
  });

  it("should calculate valid Supertrend trailing stop", () => {
    const res = calculateSupertrend(samplePrices);
    expect(res).toBeDefined();
    expect(["bullish", "bearish"]).toContain(res.direction);
    expect(res.stop).toBeGreaterThan(0);
  });

  it("should calculate valid Bollinger Bands and bandwidth", () => {
    const res = calculateBollingerBands(samplePrices, 20, 2);
    expect(res).toBeDefined();
    expect(res.upper).toBeGreaterThan(res.lower);
    expect(res.bandwidth).toBeGreaterThan(0);
    expect(res.percentB).toBeGreaterThanOrEqual(0);
  });

  it("should calculate valid ADX, +DI, and -DI", () => {
    const res = calculateADX(samplePrices, 14);
    expect(res.adx).toBeGreaterThanOrEqual(0);
    expect(res.plusDI).toBeGreaterThanOrEqual(0);
    expect(res.minusDI).toBeGreaterThanOrEqual(0);
  });

  it("should calculate Stochastic %K and %D", () => {
    const res = calculateStochastic(samplePrices, 14, 3);
    expect(res.k).toBeGreaterThanOrEqual(0);
    expect(res.k).toBeLessThanOrEqual(100);
    expect(res.d).toBeGreaterThanOrEqual(0);
    expect(res.d).toBeLessThanOrEqual(100);
  });

  it("should calculate VWAP correctly", () => {
    const volumes = samplePrices.map((_, i) => (i + 1) * 10);
    const vwap = calculateVWAP(samplePrices, volumes);
    expect(vwap).toBeGreaterThan(90000);
    expect(vwap).toBeLessThan(102000);
  });

  it("should calculate Fibonacci Retracement levels", () => {
    const res = calculateFibonacciRetracement(100000, 90000);
    expect(res.r0500).toBe(95000);
    expect(res.r0618).toBe(93820);
    expect(res.r0382).toBe(96180);
  });

  it("should calculate Ichimoku components", () => {
    const res = calculateIchimoku(samplePrices);
    expect(res.tenkan).toBeGreaterThan(0);
    expect(res.kijun).toBeGreaterThan(0);
    expect(res.senkouA).toBeGreaterThan(0);
  });

  it("should evaluate moving average crossovers", () => {
    const res = calculateCrossovers(samplePrices);
    expect(typeof res.goldenCross).toBe("boolean");
    expect(typeof res.deathCross).toBe("boolean");
  });
});
