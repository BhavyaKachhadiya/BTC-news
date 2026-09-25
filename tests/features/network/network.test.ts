import { describe, it, expect } from "vitest";
import {
  detectNetworkAnomaly,
  DEFAULT_ANOMALY_CONFIG,
} from "@/features/network/services/anomaly.service";
import type { NetworkData } from "@/features/network/types/network.types";

describe("Network Feature", () => {
  const baseData: NetworkData = {
    blockHeight: 850000,
    txCount: 50000,
    mempoolSize: 25000000,
    fastestFee: 15,
    halfHourFee: 12,
    hourFee: 10,
    timestamp: "2026-03-01T12:00:00.000Z",
    provider: "mempool.space",
  };

  it("identifies normal conditions without anomaly", () => {
    const anomaly = detectNetworkAnomaly(baseData, null);
    expect(anomaly.isAnomaly).toBe(false);
    expect(anomaly.reasons.length).toBe(0);
    expect(anomaly.feeSurgeLevel).toBe("NORMAL");
  });

  it("detects fee surge anomaly above threshold", () => {
    const surgeData: NetworkData = {
      ...baseData,
      fastestFee: 65,
    };
    const anomaly = detectNetworkAnomaly(surgeData, null);
    expect(anomaly.isAnomaly).toBe(true);
    expect(anomaly.feeSurgeLevel).toBe("ELEVATED");
    expect(anomaly.reasons.some((r) => r.includes("Fastest fee elevated"))).toBe(true);
  });

  it("detects rapid transaction surge between observations", () => {
    const currentData: NetworkData = {
      ...baseData,
      txCount: 100000, // 100% surge from 50,000
    };
    const anomaly = detectNetworkAnomaly(currentData, baseData);
    expect(anomaly.isAnomaly).toBe(true);
    expect(anomaly.txChangePercent).toBe(100);
    expect(anomaly.reasons.some((r) => r.includes("Rapid transaction backlog shift"))).toBe(true);
  });
});
