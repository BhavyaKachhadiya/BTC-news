import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  detectDerivativesEvents,
  DEFAULT_DERIVATIVES_CONFIG,
  FundingService,
  OpenInterestService,
  PositioningService,
  DerivativesService,
} from "@/features/derivatives";
import {
  binanceFundingRateResponseSchema,
  binanceOpenInterestSchema,
  binanceLongShortRatioResponseSchema,
  hyperliquidMetaAndAssetCtxsSchema,
} from "@/features/derivatives/schemas/derivatives.schema";

describe("Derivatives Intelligence Feature", () => {
  describe("Event & Anomaly Detection", () => {
    it("identifies normal, balanced derivatives market conditions", () => {
      const result = detectDerivativesEvents({
        fundingRate: 0.01, // 0.01% standard baseline
        openInterest: 50000,
        longShortRatio: 1.15,
        previousOpenInterest: 50000,
      });

      expect(result.eventFlags.isFundingSpike).toBe(false);
      expect(result.eventFlags.isOiExpansion).toBe(false);
      expect(result.eventFlags.isPositionImbalance).toBe(false);
      expect(result.reasons.length).toBe(0);
    });

    it("detects elevated positive funding spike (> 0.05%)", () => {
      const result = detectDerivativesEvents({
        fundingRate: 0.065,
        openInterest: 50000,
        longShortRatio: 1.2,
      });

      expect(result.eventFlags.isFundingSpike).toBe(true);
      expect(result.reasons.some((r) => r.includes("Funding spike elevated"))).toBe(true);
    });

    it("detects negative / discount funding spike (< -0.02%)", () => {
      const result = detectDerivativesEvents({
        fundingRate: -0.035,
        openInterest: 50000,
        longShortRatio: 0.95,
      });

      expect(result.eventFlags.isFundingSpike).toBe(true);
      expect(result.reasons.some((r) => r.includes("Funding discount / negative"))).toBe(true);
    });

    it("detects rapid open interest expansion surge (>= 5%)", () => {
      const result = detectDerivativesEvents({
        fundingRate: 0.01,
        openInterest: 110000, // +10% surge
        longShortRatio: 1.2,
        previousOpenInterest: 100000,
      });

      expect(result.eventFlags.isOiExpansion).toBe(true);
      expect(result.oiChangePercent).toBeCloseTo(10, 1);
      expect(result.reasons.some((r) => r.includes("Rapid Open Interest expansion"))).toBe(true);
    });

    it("does not flag modest open interest changes below threshold", () => {
      const result = detectDerivativesEvents({
        fundingRate: 0.01,
        openInterest: 102000, // +2% change (< 5%)
        longShortRatio: 1.2,
        previousOpenInterest: 100000,
      });

      expect(result.eventFlags.isOiExpansion).toBe(false);
      expect(result.oiChangePercent).toBeCloseTo(2, 1);
    });

    it("detects crowded long positioning imbalance (L/S ratio > 1.8)", () => {
      const result = detectDerivativesEvents({
        fundingRate: 0.02,
        openInterest: 80000,
        longShortRatio: 2.15,
      });

      expect(result.eventFlags.isPositionImbalance).toBe(true);
      expect(result.reasons.some((r) => r.includes("Crowded long positioning"))).toBe(true);
    });

    it("detects crowded short positioning imbalance (L/S ratio < 0.6)", () => {
      const result = detectDerivativesEvents({
        fundingRate: -0.01,
        openInterest: 80000,
        longShortRatio: 0.52,
      });

      expect(result.eventFlags.isPositionImbalance).toBe(true);
      expect(result.reasons.some((r) => r.includes("Crowded short positioning"))).toBe(true);
    });

    it("supports custom threshold overrides in anomaly config", () => {
      const result = detectDerivativesEvents({
        fundingRate: 0.035, // Below default 0.05, but above custom 0.03
        openInterest: 100000,
        longShortRatio: 1.5, // Below default 1.8, but above custom 1.4
        config: {
          fundingSpikeThreshold: 0.03,
          lsRatioCrowdedLongThreshold: 1.4,
        },
      });

      expect(result.eventFlags.isFundingSpike).toBe(true);
      expect(result.eventFlags.isPositionImbalance).toBe(true);
    });
  });

  describe("Zod Schema Validation", () => {
    it("validates Binance funding rate API response format", () => {
      const mockPayload = [
        {
          symbol: "BTCUSDT",
          fundingTime: 1790294400002,
          fundingRate: "0.00010000",
          markPrice: "84370.00000000",
          rateType: "Regular",
        },
      ];

      const parsed = binanceFundingRateResponseSchema.safeParse(mockPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data[0].symbol).toBe("BTCUSDT");
        expect(parsed.data[0].fundingRate).toBe("0.00010000");
      }
    });

    it("validates Binance Open Interest API response format", () => {
      const mockPayload = {
        symbol: "BTCUSDT",
        openInterest: "96181.387",
        time: 1790328533843,
      };

      const parsed = binanceOpenInterestSchema.safeParse(mockPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.openInterest).toBe("96181.387");
      }
    });

    it("validates Binance Global Long/Short Ratio response format", () => {
      const mockPayload = [
        {
          symbol: "BTCUSDT",
          longAccount: "0.5524",
          longShortRatio: "1.2341",
          shortAccount: "0.4476",
          timestamp: 1790323200000,
        },
      ];

      const parsed = binanceLongShortRatioResponseSchema.safeParse(mockPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data[0].longShortRatio).toBe("1.2341");
      }
    });

    it("validates Hyperliquid metaAndAssetCtxs response tuple", () => {
      const mockPayload = [
        {
          universe: [
            { name: "BTC", szDecimals: 5, maxLeverage: 40 },
            { name: "ETH", szDecimals: 4, maxLeverage: 25 },
          ],
        },
        [
          {
            funding: "0.0000125",
            openInterest: "40045.438",
            markPx: "84816.0",
          },
          {
            funding: "0.0000250",
            openInterest: "12000.12",
            markPx: "2850.0",
          },
        ],
      ];

      const parsed = hyperliquidMetaAndAssetCtxsSchema.safeParse(mockPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data[0].universe[0].name).toBe("BTC");
        expect(parsed.data[1][0].funding).toBe("0.0000125");
      }
    });

    it("rejects malformed responses", () => {
      const invalidPayload = { invalidKey: 123 };
      expect(binanceFundingRateResponseSchema.safeParse(invalidPayload).success).toBe(false);
      expect(binanceOpenInterestSchema.safeParse(invalidPayload).success).toBe(false);
      expect(hyperliquidMetaAndAssetCtxsSchema.safeParse(invalidPayload).success).toBe(false);
    });
  });

  describe("Service Normalization & Fallbacks", () => {
    it("FundingService normalizes Binance decimal to percentage correctly", async () => {
      const funding = new FundingService();
      vi.spyOn(funding, "getBinanceFundingRate").mockResolvedValue({
        symbol: "BTCUSDT",
        fundingRate: 0.01,
        rawFundingRate: 0.0001,
        fundingTime: 1790294400000,
        markPrice: 84000,
        provider: "binance",
        isSpike: false,
        bias: "NEUTRAL",
      });

      const res = await funding.getFundingRate("BTCUSDT");
      expect(res.fundingRate).toBe(0.01);
      expect(res.provider).toBe("binance");
      expect(res.isSpike).toBe(false);
    });

    it("FundingService falls back to Hyperliquid when Binance throws", async () => {
      const funding = new FundingService();
      vi.spyOn(funding, "getBinanceFundingRate").mockRejectedValue(new Error("Binance Rate Limit"));
      vi.spyOn(funding, "getHyperliquidFundingRate").mockResolvedValue({
        symbol: "BTCUSDT",
        fundingRate: 0.01, // 8h equivalent
        rawFundingRate: 0.0001,
        fundingTime: Date.now(),
        markPrice: 84500,
        provider: "hyperliquid",
        isSpike: false,
        bias: "NEUTRAL",
      });

      const res = await funding.getFundingRate("BTCUSDT");
      expect(res.provider).toBe("hyperliquid");
      expect(res.fundingRate).toBe(0.01);
    });

    it("OpenInterestService computes USD notional when mark price is supplied", async () => {
      const oiService = new OpenInterestService();
      vi.spyOn(oiService, "getBinanceOpenInterest").mockImplementation(async (sym, markPx) => ({
        symbol: sym ?? "BTCUSDT",
        openInterest: 1000,
        openInterestUsd: markPx ? 1000 * markPx : undefined,
        timestamp: 1790294400000,
        provider: "binance",
        isExpansion: false,
      }));

      const res = await oiService.getOpenInterest("BTCUSDT", 80000);
      expect(res.openInterest).toBe(1000);
      expect(res.openInterestUsd).toBe(80000000);
    });

    it("DerivativesService orchestrates a full snapshot with event flags", async () => {
      const mockFunding = new FundingService();
      const mockOi = new OpenInterestService();
      const mockPos = new PositioningService();

      vi.spyOn(mockFunding, "getFundingRate").mockResolvedValue({
        symbol: "BTCUSDT",
        fundingRate: 0.07, // Spike!
        rawFundingRate: 0.0007,
        fundingTime: 1790294400000,
        markPrice: 85000,
        provider: "binance",
        isSpike: true,
        bias: "HIGH_LONGS",
      });

      vi.spyOn(mockOi, "getOpenInterest").mockResolvedValue({
        symbol: "BTCUSDT",
        openInterest: 95000,
        openInterestUsd: 8075000000,
        timestamp: 1790294400000,
        provider: "binance",
        isExpansion: false,
      });

      vi.spyOn(mockPos, "getGlobalLongShortRatio").mockResolvedValue({
        symbol: "BTCUSDT",
        longShortRatio: 2.1, // Imbalance!
        longAccount: 0.677,
        shortAccount: 0.323,
        timestamp: 1790294400000,
        provider: "binance",
        isImbalanced: true,
        imbalanceSide: "LONG",
      });

      const derivatives = new DerivativesService(mockFunding, mockOi, mockPos);
      const snapshot = await derivatives.getSnapshot("BTCUSDT");

      expect(snapshot.fundingRate).toBe(0.07);
      expect(snapshot.eventFlags.isFundingSpike).toBe(true);
      expect(snapshot.eventFlags.isPositionImbalance).toBe(true);
      expect(snapshot.eventFlags.isOiExpansion).toBe(false);
      expect(snapshot.reasons?.length).toBeGreaterThan(0);
      expect(snapshot.openInterestUsd).toBe(8075000000);
    });
  });
});
