import { describe, it, expect, vi } from "vitest";
import {
  extractYahooChartQuote,
  macroSnapshotSchema,
  normalizeYieldValue,
  MacroService,
  DxyService,
  YieldsService,
  CommoditiesService,
  EquitiesService,
  BASELINE_DXY_QUOTE,
  BASELINE_YIELDS_QUOTE,
  BASELINE_GOLD_QUOTE,
  BASELINE_EQUITIES_QUOTE,
  type MacroSnapshot,
} from "@/features/macro";

describe("Macro Feature", () => {
  describe("Normalization & Extraction", () => {
    it("extracts quote from standard Yahoo Finance chart meta payload", () => {
      const mockYahooPayload = {
        chart: {
          result: [
            {
              meta: {
                symbol: "DX-Y.NYB",
                regularMarketPrice: 104.5,
                chartPreviousClose: 104.0,
                regularMarketTime: 1700000000,
              },
              indicators: {
                quote: [
                  {
                    close: [104.2, 104.5],
                  },
                ],
              },
            },
          ],
        },
      };

      const quote = extractYahooChartQuote(mockYahooPayload);
      expect(quote).not.toBeNull();
      expect(quote?.symbol).toBe("DX-Y.NYB");
      expect(quote?.price).toBe(104.5);
      expect(quote?.previousClose).toBe(104.0);
      // (104.5 - 104.0) / 104.0 * 100 = 0.48%
      expect(quote?.changePercent).toBe(0.48);
      expect(quote?.timestamp).toBe(new Date(1700000000 * 1000).toISOString());
    });

    it("falls back to indicators close array when regularMarketPrice is missing", () => {
      const mockPayload = {
        chart: {
          result: [
            {
              meta: {
                symbol: "^TNX",
                chartPreviousClose: 41.5,
              },
              indicators: {
                quote: [
                  {
                    close: [41.8, null, 42.5],
                  },
                ],
              },
            },
          ],
        },
      };

      const quote = extractYahooChartQuote(mockPayload);
      expect(quote).not.toBeNull();
      expect(quote?.price).toBe(42.5);
      expect(quote?.previousClose).toBe(41.5);
      expect(quote?.changePercent).toBe(2.41);
    });

    it("returns null on malformed or empty Yahoo response", () => {
      expect(extractYahooChartQuote(null)).toBeNull();
      expect(extractYahooChartQuote({})).toBeNull();
      expect(extractYahooChartQuote({ chart: { result: [] } })).toBeNull();
      expect(extractYahooChartQuote({ chart: { result: [{ meta: {} }] } })).toBeNull();
    });

    it("normalizes Yahoo Treasury yield scale from index points to percent", () => {
      // 42.8 on Yahoo ^TNX represents 4.28%
      expect(normalizeYieldValue(42.8)).toBe(4.28);
      expect(normalizeYieldValue(45.12)).toBe(4.512);

      // Values already <= 15 remain standard percentage
      expect(normalizeYieldValue(4.28)).toBe(4.28);
      expect(normalizeYieldValue(3.95)).toBe(3.95);
    });
  });

  describe("Zod Schema Validation", () => {
    it("validates a fully populated MacroSnapshot", () => {
      const validSnapshot: MacroSnapshot = {
        timestamp: new Date().toISOString(),
        dxy: { value: 104.25, changePercent: -0.15 },
        treasury: { twoYear: 4.15, tenYear: 4.28 },
        equities: { sp500: 5980.5, nasdaq: 19120.0 },
        gold: { price: 2685.5, changePercent: 0.35 },
        freshness: "available",
      };

      const parsed = macroSnapshotSchema.safeParse(validSnapshot);
      expect(parsed.success).toBe(true);
    });

    it("validates a partial MacroSnapshot with stale freshness", () => {
      const partialSnapshot: MacroSnapshot = {
        timestamp: new Date().toISOString(),
        dxy: { value: 104.25, changePercent: 0.0 },
        freshness: "stale",
      };

      const parsed = macroSnapshotSchema.safeParse(partialSnapshot);
      expect(parsed.success).toBe(true);
    });

    it("rejects an invalid freshness value", () => {
      const invalidSnapshot = {
        timestamp: new Date().toISOString(),
        freshness: "unknown_status",
      };

      const parsed = macroSnapshotSchema.safeParse(invalidSnapshot);
      expect(parsed.success).toBe(false);
    });
  });

  describe("Resilient Fallback Handling", () => {
    it("DxyService falls back to cached quote when live fetch fails", async () => {
      const service = new DxyService();
      const mockCached = {
        symbol: "DX-Y.NYB",
        value: 103.8,
        changePercent: -0.05,
        timestamp: "2026-03-01T10:00:00.000Z",
      };
      service.setCachedQuote(mockCached);

      vi.spyOn(service, "fetchLiveQuote").mockRejectedValue(new Error("Network timeout"));

      const quote = await service.getDxyQuote(true);
      expect(quote.value).toBe(103.8);
      expect(quote.symbol).toBe("DX-Y.NYB");
    });

    it("DxyService returns baseline fallback when live fetch fails and no cache exists", async () => {
      const service = new DxyService();
      vi.spyOn(service, "fetchLiveQuote").mockRejectedValue(new Error("HTTP 429 Too Many Requests"));

      const quote = await service.getDxyQuote(true);
      expect(quote.value).toBe(BASELINE_DXY_QUOTE.value);
      expect(quote.symbol).toBe(BASELINE_DXY_QUOTE.symbol);
    });

    it("YieldsService returns baseline fallback when live fetch fails and no cache exists", async () => {
      const service = new YieldsService();
      vi.spyOn(service, "fetchLiveYields").mockRejectedValue(new Error("502 Bad Gateway"));

      const yields = await service.getYields(true);
      expect(yields.tenYear).toBe(BASELINE_YIELDS_QUOTE.tenYear);
      expect(yields.twoYear).toBe(BASELINE_YIELDS_QUOTE.twoYear);
      expect(yields.spread).toBe(BASELINE_YIELDS_QUOTE.spread);
    });

    it("CommoditiesService returns baseline fallback when live fetch fails", async () => {
      const service = new CommoditiesService();
      vi.spyOn(service, "fetchLiveGold").mockRejectedValue(new Error("Timeout"));

      const gold = await service.getGoldQuote(true);
      expect(gold.price).toBe(BASELINE_GOLD_QUOTE.price);
    });

    it("EquitiesService returns baseline fallback when live fetch fails", async () => {
      const service = new EquitiesService();
      vi.spyOn(service, "fetchLiveEquities").mockRejectedValue(new Error("Offline"));

      const equities = await service.getEquitiesQuote(true);
      expect(equities.sp500).toBe(BASELINE_EQUITIES_QUOTE.sp500);
      expect(equities.nasdaq).toBe(BASELINE_EQUITIES_QUOTE.nasdaq);
    });
  });

  describe("Data Freshness Classification", () => {
    it("classifies snapshot as 'available' when all live feeds resolve successfully", async () => {
      const mockDxy = new DxyService();
      const mockYields = new YieldsService();
      const mockCommodities = new CommoditiesService();
      const mockEquities = new EquitiesService();

      vi.spyOn(mockDxy, "fetchLiveQuote").mockResolvedValue({
        symbol: "DX-Y.NYB",
        value: 104.1,
        changePercent: -0.2,
        timestamp: new Date().toISOString(),
      });
      vi.spyOn(mockYields, "fetchLiveYields").mockResolvedValue({
        tenYear: 4.25,
        twoYear: 4.10,
        spread: 0.15,
        timestamp: new Date().toISOString(),
      });
      vi.spyOn(mockCommodities, "fetchLiveGold").mockResolvedValue({
        symbol: "GC=F",
        price: 2680.0,
        changePercent: 0.4,
        timestamp: new Date().toISOString(),
      });
      vi.spyOn(mockEquities, "fetchLiveEquities").mockResolvedValue({
        sp500: 5990.0,
        nasdaq: 19150.0,
        timestamp: new Date().toISOString(),
      });

      const macroService = new MacroService({
        dxyService: mockDxy,
        yieldsService: mockYields,
        commoditiesService: mockCommodities,
        equitiesService: mockEquities,
      });

      const snapshot = await macroService.getMacroSnapshot();
      expect(snapshot.freshness).toBe("available");
      expect(snapshot.dxy?.value).toBe(104.1);
      expect(snapshot.treasury?.tenYear).toBe(4.25);
      expect(snapshot.gold?.price).toBe(2680.0);
      expect(snapshot.equities?.sp500).toBe(5990.0);
    });

    it("classifies snapshot as 'stale' when live feeds fail but fallback/cached data is used", async () => {
      const mockDxy = new DxyService();
      const mockYields = new YieldsService();
      const mockCommodities = new CommoditiesService();
      const mockEquities = new EquitiesService();

      // Live calls fail
      vi.spyOn(mockDxy, "fetchLiveQuote").mockRejectedValue(new Error("Live API Down"));
      vi.spyOn(mockYields, "fetchLiveYields").mockRejectedValue(new Error("Live API Down"));
      vi.spyOn(mockCommodities, "fetchLiveGold").mockRejectedValue(new Error("Live API Down"));
      vi.spyOn(mockEquities, "fetchLiveEquities").mockRejectedValue(new Error("Live API Down"));

      const macroService = new MacroService({
        dxyService: mockDxy,
        yieldsService: mockYields,
        commoditiesService: mockCommodities,
        equitiesService: mockEquities,
      });

      const snapshot = await macroService.getMacroSnapshot({ allowFallback: true });
      expect(snapshot.freshness).toBe("stale");
      expect(snapshot.dxy?.value).toBe(BASELINE_DXY_QUOTE.value);
      expect(snapshot.treasury?.tenYear).toBe(BASELINE_YIELDS_QUOTE.tenYear);
    });

    it("classifies snapshot as 'unavailable' when live feeds fail and allowFallback is false", async () => {
      const mockDxy = new DxyService();
      const mockYields = new YieldsService();
      const mockCommodities = new CommoditiesService();
      const mockEquities = new EquitiesService();

      vi.spyOn(mockDxy, "fetchLiveQuote").mockRejectedValue(new Error("Down"));
      vi.spyOn(mockYields, "fetchLiveYields").mockRejectedValue(new Error("Down"));
      vi.spyOn(mockCommodities, "fetchLiveGold").mockRejectedValue(new Error("Down"));
      vi.spyOn(mockEquities, "fetchLiveEquities").mockRejectedValue(new Error("Down"));

      const macroService = new MacroService({
        dxyService: mockDxy,
        yieldsService: mockYields,
        commoditiesService: mockCommodities,
        equitiesService: mockEquities,
      });

      const snapshot = await macroService.getMacroSnapshot({ allowFallback: false });
      expect(snapshot.freshness).toBe("unavailable");
      expect(snapshot.dxy).toBeUndefined();
      expect(snapshot.treasury).toBeUndefined();
      expect(snapshot.gold).toBeUndefined();
      expect(snapshot.equities).toBeUndefined();
    });

    it("never throws an unhandled rejection, preserving pipeline stability", async () => {
      const mockDxy = new DxyService();
      const mockYields = new YieldsService();
      const mockCommodities = new CommoditiesService();
      const mockEquities = new EquitiesService();

      vi.spyOn(mockDxy, "fetchLiveQuote").mockRejectedValue(new Error("Catastrophic error"));
      vi.spyOn(mockYields, "fetchLiveYields").mockResolvedValue(BASELINE_YIELDS_QUOTE);
      vi.spyOn(mockCommodities, "fetchLiveGold").mockResolvedValue(BASELINE_GOLD_QUOTE);
      vi.spyOn(mockEquities, "fetchLiveEquities").mockResolvedValue(BASELINE_EQUITIES_QUOTE);

      const macroService = new MacroService({
        dxyService: mockDxy,
        yieldsService: mockYields,
        commoditiesService: mockCommodities,
        equitiesService: mockEquities,
      });
      await expect(macroService.getMacroSnapshot()).resolves.toBeDefined();
    });
  });

  describe("Macro Regime Interpretation", () => {
    const service = new MacroService();

    it("identifies risk-on regime when DXY is weakening and equities are strong", () => {
      const snapshot: MacroSnapshot = {
        timestamp: new Date().toISOString(),
        dxy: { value: 103.5, changePercent: -0.35 },
        equities: { sp500: 5950.0 },
        freshness: "available",
      };

      const result = service.interpretRegime(snapshot);
      expect(result.regime).toBe("risk-on");
      expect(result.summary).toContain("Dollar softening");
    });

    it("identifies risk-off regime when DXY is surging", () => {
      const snapshot: MacroSnapshot = {
        timestamp: new Date().toISOString(),
        dxy: { value: 105.8, changePercent: 0.45 },
        equities: { sp500: 4800.0 },
        freshness: "available",
      };

      const result = service.interpretRegime(snapshot);
      expect(result.regime).toBe("risk-off");
      expect(result.summary).toContain("Dollar strength");
    });

    it("identifies neutral regime when conditions are steady", () => {
      const snapshot: MacroSnapshot = {
        timestamp: new Date().toISOString(),
        dxy: { value: 104.2, changePercent: 0.02 },
        equities: { sp500: 5100.0 },
        freshness: "available",
      };

      const result = service.interpretRegime(snapshot);
      expect(result.regime).toBe("neutral");
    });
  });
});
