import type {
  NetworkData,
  NetworkAnomaly,
  NetworkAnomalyConfig,
} from "../types/network.types";

export const DEFAULT_ANOMALY_CONFIG: NetworkAnomalyConfig = {
  txCountChangeThreshold: 0.5, // 50% change
  mempoolSizeChangeThreshold: 0.5,
  feeSurgeThresholdSatVb: 50, // sat/vB
  feeChangeRatioThreshold: 1.0, // 100% surge
};

export function detectNetworkAnomaly(
  current: NetworkData,
  previous?: NetworkData | null,
  config: NetworkAnomalyConfig = DEFAULT_ANOMALY_CONFIG,
): NetworkAnomaly {
  const reasons: string[] = [];
  let txChangePercent: number | undefined;
  let mempoolSizeChangePercent: number | undefined;

  // Static fee thresholds
  let feeSurgeLevel: "NORMAL" | "ELEVATED" | "EXTREME" = "NORMAL";
  if (current.fastestFee >= 100) {
    feeSurgeLevel = "EXTREME";
    reasons.push(`Fastest fee critical: ${current.fastestFee} sat/vB`);
  } else if (current.fastestFee >= config.feeSurgeThresholdSatVb) {
    feeSurgeLevel = "ELEVATED";
    reasons.push(`Fastest fee elevated: ${current.fastestFee} sat/vB`);
  }

  // Extreme congestion check
  if (current.txCount > 250000) {
    reasons.push(`Severe mempool congestion: ${current.txCount.toLocaleString()} pending txs`);
  }

  // Delta comparisons if previous observation exists
  if (previous) {
    if (previous.txCount > 0) {
      txChangePercent = ((current.txCount - previous.txCount) / previous.txCount) * 100;
      const ratio = (current.txCount - previous.txCount) / previous.txCount;
      if (Math.abs(ratio) >= config.txCountChangeThreshold) {
        reasons.push(
          `Rapid transaction backlog shift: ${txChangePercent > 0 ? "+" : ""}${txChangePercent.toFixed(1)}%`,
        );
      }
    }

    if (previous.mempoolSize > 0) {
      mempoolSizeChangePercent =
        ((current.mempoolSize - previous.mempoolSize) / previous.mempoolSize) * 100;
      const sizeRatio = (current.mempoolSize - previous.mempoolSize) / previous.mempoolSize;
      if (Math.abs(sizeRatio) >= config.mempoolSizeChangeThreshold) {
        reasons.push(
          `Mempool memory shift: ${mempoolSizeChangePercent > 0 ? "+" : ""}${mempoolSizeChangePercent.toFixed(1)}%`,
        );
      }
    }

    if (previous.fastestFee > 0) {
      const feeRatio = (current.fastestFee - previous.fastestFee) / previous.fastestFee;
      if (feeRatio >= config.feeChangeRatioThreshold) {
        reasons.push(`Fee surge detected: +${(feeRatio * 100).toFixed(0)}% increase`);
      }
    }
  }

  return {
    isAnomaly: reasons.length > 0,
    reasons,
    txChangePercent,
    mempoolSizeChangePercent,
    feeSurgeLevel,
  };
}
