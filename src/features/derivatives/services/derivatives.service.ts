import { logger } from "@/shared/logger/logger";
import { fundingService, FundingService } from "./funding.service";
import { openInterestService, OpenInterestService } from "./open-interest.service";
import { positioningService, PositioningService } from "./positioning.service";
import type {
  DerivativesSnapshot,
  DerivativesEventFlags,
  DerivativesAnomalyConfig,
  DerivativesProvider,
  FundingRateData,
  OpenInterestData,
  LongShortRatioData,
} from "../types/derivatives.types";

export const DEFAULT_DERIVATIVES_CONFIG: DerivativesAnomalyConfig = {
  fundingSpikeThreshold: 0.05, // > 0.05% 8h rate
  fundingNegativeThreshold: -0.02, // < -0.02% 8h rate
  lsRatioCrowdedLongThreshold: 1.8, // > 1.8
  lsRatioCrowdedShortThreshold: 0.6, // < 0.6
  oiExpansionPercentThreshold: 5.0, // > 5.0% change
};

export interface DetectEventsParams {
  readonly fundingRate: number;
  readonly openInterest: number;
  readonly longShortRatio: number;
  readonly previousOpenInterest?: number | null;
  readonly config?: Partial<DerivativesAnomalyConfig>;
}

export interface DetectEventsResult {
  readonly eventFlags: DerivativesEventFlags;
  readonly reasons: readonly string[];
  readonly oiChangePercent?: number;
}

/**
 * Pure function to detect unusual derivatives events:
 * - Funding spikes (> 0.05% or < -0.02%)
 * - Extreme OI expansion / surges
 * - Position imbalances (L/S ratio > 1.8 or < 0.6)
 */
export function detectDerivativesEvents(params: DetectEventsParams): DetectEventsResult {
  const {
    fundingRate,
    openInterest,
    longShortRatio,
    previousOpenInterest,
    config: userConfig,
  } = params;

  const config: DerivativesAnomalyConfig = {
    ...DEFAULT_DERIVATIVES_CONFIG,
    ...userConfig,
  };

  const reasons: string[] = [];

  // 1. Funding Spike Detection (> 0.05% or < -0.02% or negative)
  let isFundingSpike = false;
  if (fundingRate >= config.fundingSpikeThreshold) {
    isFundingSpike = true;
    reasons.push(
      `Funding spike elevated (${fundingRate.toFixed(4)}%): Longs heavily paying shorts (long squeeze / flush risk)`,
    );
  } else if (fundingRate <= config.fundingNegativeThreshold) {
    isFundingSpike = true;
    reasons.push(
      `Funding discount / negative (${fundingRate.toFixed(4)}%): Shorts paying longs (short squeeze potential)`,
    );
  }

  // 2. Open Interest Expansion Detection
  let isOiExpansion = false;
  let oiChangePercent: number | undefined;

  if (previousOpenInterest && previousOpenInterest > 0) {
    oiChangePercent = ((openInterest - previousOpenInterest) / previousOpenInterest) * 100;
    if (oiChangePercent >= config.oiExpansionPercentThreshold) {
      isOiExpansion = true;
      reasons.push(
        `Rapid Open Interest expansion: +${oiChangePercent.toFixed(2)}% surge signifies aggressive leverage buildup`,
      );
    }
  }

  // 3. Position Imbalance Detection (L/S ratio > 1.8 or < 0.6)
  let isPositionImbalance = false;
  if (longShortRatio >= config.lsRatioCrowdedLongThreshold) {
    isPositionImbalance = true;
    reasons.push(
      `Crowded long positioning: L/S ratio is ${longShortRatio.toFixed(2)} (>= ${config.lsRatioCrowdedLongThreshold}), extreme long bias`,
    );
  } else if (longShortRatio <= config.lsRatioCrowdedShortThreshold) {
    isPositionImbalance = true;
    reasons.push(
      `Crowded short positioning: L/S ratio is ${longShortRatio.toFixed(2)} (<= ${config.lsRatioCrowdedShortThreshold}), extreme short bias`,
    );
  }

  return {
    eventFlags: {
      isFundingSpike,
      isOiExpansion,
      isPositionImbalance,
    },
    reasons,
    oiChangePercent,
  };
}

export class DerivativesService implements DerivativesProvider {
  private readonly funding: FundingService;
  private readonly openInterest: OpenInterestService;
  private readonly positioning: PositioningService;
  private previousSnapshot: DerivativesSnapshot | null = null;

  constructor(
    funding = fundingService,
    openInterest = openInterestService,
    positioning = positioningService,
  ) {
    this.funding = funding;
    this.openInterest = openInterest;
    this.positioning = positioning;
  }

  public async getFundingRate(symbol = "BTCUSDT"): Promise<FundingRateData> {
    return this.funding.getFundingRate(symbol);
  }

  public async getOpenInterest(symbol = "BTCUSDT", markPrice?: number): Promise<OpenInterestData> {
    return this.openInterest.getOpenInterest(symbol, markPrice);
  }

  public async getLongShortRatio(symbol = "BTCUSDT"): Promise<LongShortRatioData> {
    return this.positioning.getGlobalLongShortRatio(symbol);
  }

  /**
   * Aggregates funding rate, open interest, and long/short ratio into a unified DerivativesSnapshot.
   */
  public async getDerivativesSnapshot(symbol = "BTCUSDT"): Promise<DerivativesSnapshot> {
    return this.getSnapshot(symbol);
  }

  public async getSnapshot(symbol = "BTCUSDT"): Promise<DerivativesSnapshot> {
    logger.debug(`Generating aggregated derivatives snapshot for ${symbol}`, "DerivativesService");

    // Fetch funding and positioning concurrently
    const [fundingRes, lsRes] = await Promise.all([
      this.getFundingRate(symbol),
      this.getLongShortRatio(symbol),
    ]);

    // Use funding mark price for open interest USD calculation if available
    const markPrice = fundingRes.markPrice;
    const oiRes = await this.getOpenInterest(symbol, markPrice);

    // Run event detection
    const { eventFlags, reasons } = detectDerivativesEvents({
      fundingRate: fundingRes.fundingRate,
      openInterest: oiRes.openInterest,
      longShortRatio: lsRes.longShortRatio,
      previousOpenInterest: this.previousSnapshot?.openInterest ?? null,
    });

    const snapshot: DerivativesSnapshot = {
      timestamp: new Date().toISOString(),
      fundingRate: fundingRes.fundingRate,
      openInterest: oiRes.openInterest,
      openInterestUsd: oiRes.openInterestUsd,
      longShortRatio: lsRes.longShortRatio,
      liquidations: undefined, // Public endpoints do not stream real-time liquidations without websocket
      eventFlags,
      reasons,
      markPrice,
      provider: fundingRes.provider,
    };

    // Cache this snapshot to track deltas in subsequent calls
    this.previousSnapshot = snapshot;

    return snapshot;
  }
}

export const derivativesService = new DerivativesService();
