export type EconomicEventImpact = "HIGH" | "MEDIUM" | "LOW";

export type EconomicEventStatus = "UPCOMING" | "RELEASED";

export interface EconomicEvent {
  readonly id: string;
  readonly name: string;
  readonly category: "FOMC" | "CPI" | "PPI" | "NFP" | "GDP";
  readonly impact: EconomicEventImpact;
  readonly scheduledAt: string;
  readonly status: EconomicEventStatus;
  readonly consensus?: string;
  readonly actual?: string;
  readonly previous?: string;
  readonly btcImplication: string;
}

export interface EconomicCalendarSummary {
  readonly nextHighImpactEvent: EconomicEvent | null;
  readonly daysUntilNextFomc: number | null;
  readonly upcomingEvents: readonly EconomicEvent[];
  readonly recentReleases: readonly EconomicEvent[];
}
