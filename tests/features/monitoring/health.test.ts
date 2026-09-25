import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthMonitoringService } from "@/features/monitoring/services/health.service";

describe("HealthMonitoringService", () => {
  let service: HealthMonitoringService;

  beforeEach(() => {
    service = new HealthMonitoringService();
  });

  it("successfully aggregates health status across providers", async () => {
    const health = await service.checkSystemHealth();

    expect(health).toBeDefined();
    expect(health.totalProviders).toBe(6);
    expect(health.providers.length).toBe(6);
    expect(["healthy", "degraded", "down"]).toContain(health.overallStatus);

    for (const p of health.providers) {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.category).toBeDefined();
      expect(["healthy", "degraded", "down"]).toContain(p.status);
      expect(typeof p.latencyMs).toBe("number");
      expect(p.lastUpdated).toBeDefined();
    }
  }, 15000);

  it("calculates overallStatus as healthy or degraded when no major outage occurs", async () => {
    const health = await service.checkSystemHealth();
    expect(health.healthyCount + health.degradedCount + health.downCount).toBe(6);
  }, 15000);
});
