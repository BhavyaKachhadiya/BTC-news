import { describe, it, expect } from "vitest";
import { ExchangeFlowService } from "@/features/whale-intelligence/services/exchange-flow.service";

describe("ExchangeFlowService", () => {
  it("computes venue breakdown and net accumulation delta", () => {
    const service = new ExchangeFlowService();
    const flows = service.getExchangeFlows(95_000);

    expect(flows).toBeDefined();
    expect(flows.venues.length).toBe(4); // Binance, Coinbase Pro, Bitfinex, Kraken
    expect(flows.totalInflowBtc).toBeGreaterThan(0);
    expect(flows.totalOutflowBtc).toBeGreaterThan(0);
    expect(typeof flows.netFlowBtc).toBe("number");
    expect(typeof flows.netFlowUsd).toBe("number");
    expect(["ACCUMULATION", "DISTRIBUTION", "BALANCED"]).toContain(flows.bias);
    expect(flows.reservePressureIndex).toBeGreaterThanOrEqual(0);
    expect(flows.reservePressureIndex).toBeLessThanOrEqual(100);
    expect(flows.interpretation).toBeDefined();

    for (const v of flows.venues) {
      expect(v.exchange).toBeDefined();
      expect(v.inflowBtc).toBeGreaterThan(0);
      expect(v.outflowBtc).toBeGreaterThan(0);
      expect(typeof v.netFlowBtc).toBe("number");
      expect(typeof v.reserveChangePercent24h).toBe("number");
    }
  });
});
