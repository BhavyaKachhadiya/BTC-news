import { describe, it, expect } from "vitest";
import { EconomicCalendarService } from "@/features/macro/services/calendar.service";

describe("EconomicCalendarService", () => {
  it("generates a structured economic calendar with upcoming and past releases", () => {
    const service = new EconomicCalendarService();
    const calendar = service.getEconomicCalendar(new Date("2026-09-25T12:00:00Z"));

    expect(calendar).toBeDefined();
    expect(calendar.upcomingEvents.length).toBeGreaterThan(0);
    expect(calendar.recentReleases.length).toBeGreaterThan(0);

    // Verify next high impact event
    expect(calendar.nextHighImpactEvent).not.toBeNull();
    expect(calendar.nextHighImpactEvent?.impact).toBe("HIGH");

    // Verify FOMC countdown calculation
    expect(typeof calendar.daysUntilNextFomc).toBe("number");
    expect(calendar.daysUntilNextFomc).toBeGreaterThanOrEqual(0);

    // Verify event structure
    const firstEvent = calendar.upcomingEvents[0];
    expect(firstEvent.id).toBeDefined();
    expect(firstEvent.name).toBeDefined();
    expect(firstEvent.category).toBeDefined();
    expect(firstEvent.btcImplication).toBeDefined();
  });
});
