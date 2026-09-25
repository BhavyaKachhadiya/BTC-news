import { describe, it, expect, beforeEach } from "vitest";
import { StrategyStorageService } from "@/features/strategy-lab/services/strategy-storage.service";
import { DEFAULT_STRATEGY_PARAMETERS } from "@/features/strategy-lab/types/strategy.types";

describe("StrategyStorageService", () => {
  let service: StrategyStorageService;

  beforeEach(() => {
    service = new StrategyStorageService();
  });

  it("can create, retrieve, list, and delete saved strategies", async () => {
    const created = await service.createStrategy({
      name: "Alpha Trend 2026",
      description: "Aggressive trend follower with tight ATR stops",
      preset: "trend_following",
      parameters: {
        ...DEFAULT_STRATEGY_PARAMETERS,
        rsiLongThreshold: 52,
        minConfidence: 75,
      },
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Alpha Trend 2026");
    expect(created.parameters.rsiLongThreshold).toBe(52);
    expect(created.parameters.minConfidence).toBe(75);

    // Retrieve by ID
    const retrieved = await service.getStrategyById(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe("Alpha Trend 2026");

    // List strategies
    const all = await service.listStrategies();
    expect(all.some((s) => s.id === created.id)).toBe(true);

    // Delete
    const deleted = await service.deleteStrategy(created.id);
    expect(deleted).toBe(true);

    const afterDelete = await service.getStrategyById(created.id);
    expect(afterDelete).toBeNull();
  });
});
