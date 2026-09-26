export interface OrderBlock {
  readonly price: number;
  readonly high?: number;
  readonly low?: number;
  readonly volume?: number;
  readonly timestamp?: string;
  readonly mitigated?: boolean;
}

export interface LiquidityState {
  readonly recentSweeps: number;
  readonly unmitigatedPools: number;
  readonly buySide: readonly number[];
  readonly sellSide: readonly number[];
}

export interface VolumeProfileState {
  readonly poc: number; // Point of Control
  readonly vah: number; // Value Area High
  readonly val: number; // Value Area Low
}

export interface RiskMetricsState {
  readonly suggestedRR: number;
  readonly volatilityStopPct: number;
  readonly atrRisk: number;
  readonly invalidation: number;
}

export interface PsychologyState {
  readonly sentiment: string;
  readonly fomoScore: number;
  readonly overextensionHazard: boolean;
  readonly patienceFilter: boolean;
}

export interface MarketStructureState {
  readonly structure: "bullish" | "bearish" | "ranging";
  readonly supportLevels: readonly number[];
  readonly resistanceLevels: readonly number[];
  readonly demandBlocks: readonly OrderBlock[];
  readonly supplyBlocks: readonly OrderBlock[];
  readonly liquidity: LiquidityState;
  readonly volumeProfile: VolumeProfileState;
  readonly riskMetrics: RiskMetricsState;
  readonly psychology: PsychologyState;
}
