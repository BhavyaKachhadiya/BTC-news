export interface NetworkData {
  readonly blockHeight: number;
  readonly txCount: number;
  readonly mempoolSize: number;
  readonly fastestFee: number;
  readonly halfHourFee: number;
  readonly hourFee: number;
  readonly timestamp: string;
  readonly provider: "mempool.space";
}

export interface NetworkAnomaly {
  readonly isAnomaly: boolean;
  readonly reasons: readonly string[];
  readonly txChangePercent?: number;
  readonly mempoolSizeChangePercent?: number;
  readonly feeSurgeLevel: "NORMAL" | "ELEVATED" | "EXTREME";
}

export interface NetworkAnomalyConfig {
  readonly txCountChangeThreshold: number;
  readonly mempoolSizeChangeThreshold: number;
  readonly feeSurgeThresholdSatVb: number;
  readonly feeChangeRatioThreshold: number;
}

export interface NetworkProvider {
  getCurrentNetworkData(): Promise<NetworkData>;
}
