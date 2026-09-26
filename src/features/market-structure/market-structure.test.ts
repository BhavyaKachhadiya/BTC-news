import { describe, it, expect } from "vitest";
import { marketStructureService } from "./market-structure.service";

describe("Market Structure Service", () => {
  const samplePrices = [
    91000, 91500, 91200, 92000, 92800, 92400, 93100, 93500, 94000, 93800,
    94500, 95000, 94800, 95500, 96000, 95800, 96500, 97000, 96800, 97500,
    98000, 97800, 98500, 99000, 98800, 99500, 100000, 99800, 100500, 101000,
  ];

  it("should calculate complete market structure state", () => {
    const result = marketStructureService.analyze(samplePrices);

    expect(result).toBeDefined();
    expect(["bullish", "bearish", "ranging"]).toContain(result.structure);
    expect(result.supportLevels.length).toBeGreaterThan(0);
    expect(result.demandBlocks.length).toBeGreaterThanOrEqual(0);
    expect(result.liquidity.unmitigatedPools).toBeGreaterThanOrEqual(0);
    expect(result.volumeProfile.poc).toBeGreaterThan(0);
    expect(result.riskMetrics.suggestedRR).toBeGreaterThan(0);
    expect(result.riskMetrics.volatilityStopPct).toBeGreaterThan(0);
    expect(typeof result.psychology.sentiment).toBe("string");
  });

  it("should work with default benchmark prices when called with no arguments", () => {
    const result = marketStructureService.analyze();

    expect(result).toBeDefined();
    expect(["bullish", "bearish", "ranging"]).toContain(result.structure);
    expect(result.supportLevels.length).toBeGreaterThan(0);
    expect(result.resistanceLevels.length).toBeGreaterThan(0);
    expect(result.riskMetrics.suggestedRR).toBeGreaterThan(0);
  });
});
