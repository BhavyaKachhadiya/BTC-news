export interface OrderBlock {
  readonly price: number;
  readonly high?: number;
  readonly low?: number;
  readonly volume?: number;
  readonly timestamp?: string;
  readonly mitigated?: boolean;
}

export interface LiquidityBar {
  readonly open?: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume?: number;
  readonly openTime?: number;
  readonly closeTime?: number;
}

export interface LiquiditySweep {
  readonly level: number; // The exact price level where the sweep happened (e.g. 84134)
  readonly type: "low_sweep" | "high_sweep"; // "low_sweep" (swept low / reclaimed) or "high_sweep" (swept high / rejected)
  readonly sweptExtreme?: number; // The extreme wick price reached during the sweep
  readonly label: string; // e.g. "Low Swept (Reclaimed ↑)" or "High Swept (Rejected ↓)"
  readonly timeAgo?: string;
  readonly timeframe?: string;
}

export interface LiquidityState {
  readonly timeframe?: string;
  readonly recentSweeps: number;
  readonly sweeps: readonly LiquiditySweep[];
  readonly sweptLevels: readonly number[];
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

export interface ConfluenceIndicators {
  readonly rsi: number;
  readonly macd: {
    readonly macd: number;
    readonly signal: number;
    readonly histogram: number;
    readonly trend: "bullish" | "bearish";
  };
  readonly supertrend: {
    readonly direction: "bullish" | "bearish";
    readonly stop: number;
  };
  readonly bollinger: {
    readonly upper: number;
    readonly lower: number;
    readonly bandwidth: number;
    readonly percentB: number;
  };
  readonly vwap: number;
  readonly ichimoku: {
    readonly tenkan: number;
    readonly kijun: number;
    readonly senkouA: number;
    readonly senkouB: number;
    readonly sentiment: string;
  };
  readonly stochastic: {
    readonly k: number;
    readonly d: number;
    readonly signal: string;
  };
  readonly adx: {
    readonly adx: number;
    readonly plusDI: number;
    readonly minusDI: number;
    readonly trendStrength: string;
  };
  readonly elliottWave: {
    readonly currentWave: string;
    readonly phase: string;
    readonly direction: string;
    readonly targetPrice: number;
    readonly description: string;
  };
  readonly fibonacci: {
    readonly p236: number;
    readonly p382: number;
    readonly p500: number;
    readonly p618: number;
    readonly p786: number;
  };
  readonly crossovers: {
    readonly goldenCross: boolean;
    readonly deathCross: boolean;
    readonly summary: string;
  };
}

export interface MarketStructureState {
  readonly timeframe?: string;
  readonly structure: "bullish" | "bearish" | "ranging";
  readonly bars?: readonly LiquidityBar[];
  readonly supportLevels: readonly number[];
  readonly resistanceLevels: readonly number[];
  readonly demandBlocks: readonly OrderBlock[];
  readonly supplyBlocks: readonly OrderBlock[];
  readonly liquidity: LiquidityState;
  readonly volumeProfile: VolumeProfileState;
  readonly riskMetrics: RiskMetricsState;
  readonly psychology: PsychologyState;
  readonly indicators?: ConfluenceIndicators;
}
