export type ProviderHealthStatus = "healthy" | "degraded" | "down";

export interface ProviderHealthDetail {
  readonly id: string;
  readonly name: string;
  readonly category: "market" | "network" | "derivatives" | "macro" | "whale" | "database";
  readonly status: ProviderHealthStatus;
  readonly latencyMs: number;
  readonly lastUpdated: string;
  readonly isStale: boolean;
  readonly message?: string;
}

export interface SystemHealthSummary {
  readonly overallStatus: ProviderHealthStatus;
  readonly checkedAt: string;
  readonly totalProviders: number;
  readonly healthyCount: number;
  readonly degradedCount: number;
  readonly downCount: number;
  readonly providers: readonly ProviderHealthDetail[];
}
