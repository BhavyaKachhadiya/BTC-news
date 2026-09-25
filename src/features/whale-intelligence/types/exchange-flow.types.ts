export type ExchangeFlowBias = "ACCUMULATION" | "DISTRIBUTION" | "BALANCED";

export interface ExchangeVenueFlow {
  readonly exchange: string;
  readonly inflowBtc: number;
  readonly outflowBtc: number;
  readonly netFlowBtc: number;
  readonly netFlowUsd: number;
  readonly reserveChangePercent24h: number;
}

export interface ExchangeFlowSummary {
  readonly timestamp: string;
  readonly totalInflowBtc: number;
  readonly totalOutflowBtc: number;
  readonly netFlowBtc: number;
  readonly netFlowUsd: number;
  readonly bias: ExchangeFlowBias;
  readonly reservePressureIndex: number; // 0 to 100
  readonly venues: readonly ExchangeVenueFlow[];
  readonly interpretation: string;
}
