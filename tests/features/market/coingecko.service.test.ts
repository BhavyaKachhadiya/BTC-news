import { describe, it, expect, vi, beforeEach } from "vitest";
import { CoinGeckoService } from "@/features/market/services/coingecko.service";
import { coinGeckoSimplePriceSchema, coinGeckoMarketChartSchema } from "@/features/market/schemas/market.schema";
import { ValidationError } from "@/shared/errors/app-error";

describe("CoinGecko Market Feature", () => {
  describe("Schemas", () => {
    it("validates valid CoinGecko simple price response", () => {
      const valid = {
        bitcoin: {
          usd: 84500.5,
          usd_24h_change: 2.34,
          usd_24h_vol: 34000000000,
          usd_market_cap: 1670000000000,
        },
      };
      const parsed = coinGeckoSimplePriceSchema.parse(valid);
      expect(parsed.bitcoin.usd).toBe(84500.5);
      expect(parsed.bitcoin.usd_24h_change).toBe(2.34);
    });

    it("rejects non-positive price or invalid structure", () => {
      const invalid = {
        bitcoin: {
          usd: -100,
        },
      };
      expect(() => coinGeckoSimplePriceSchema.parse(invalid)).toThrow();
    });

    it("validates market chart schema", () => {
      const validChart = {
        prices: [
          [1700000000000, 84000],
          [1700086400000, 84500],
        ],
      };
      const parsed = coinGeckoMarketChartSchema.parse(validChart);
      expect(parsed.prices.length).toBe(2);
      expect(parsed.prices[0][1]).toBe(84000);
    });
  });

  describe("CoinGeckoService", () => {
    it("initializes without api key or with key", () => {
      const serviceNoKey = new CoinGeckoService();
      const serviceWithKey = new CoinGeckoService("CG-TEST-KEY");
      expect(serviceNoKey).toBeDefined();
      expect(serviceWithKey).toBeDefined();
    });
  });
});
