import { prisma } from "@/shared/database/prisma";
import { logger } from "@/shared/logger/logger";
import { timeframeService } from "./timeframe.service";
import type {
  TimeframeAnalysis,
  MultiTimeframeAlignment,
  AlignmentStatus,
  TimeframeTrend,
  Timeframe,
} from "../types/timeframe.types";
import { multiTimeframeAlignmentSchema } from "../schemas/timeframe.schema";

/**
 * Pure function to synthesize independent timeframe analyses into an overall
 * MultiTimeframeAlignment without prematurely blending their underlying indicators.
 */
export function computeMultiTimeframeAlignment(
  timeframes: readonly TimeframeAnalysis[],
): MultiTimeframeAlignment {
  if (!timeframes || timeframes.length === 0) {
    return {
      overallTrend: "uncertain",
      alignedCount: 0,
      alignmentStatus: "uncertain",
      timeframes: [],
    };
  }

  const bullishCount = timeframes.filter((t) => t.trend === "bullish").length;
  const bearishCount = timeframes.filter((t) => t.trend === "bearish").length;
  const rangingCount = timeframes.filter((t) => t.trend === "ranging").length;
  const uncertainCount = timeframes.filter((t) => t.trend === "uncertain").length;

  const tfMap = new Map<Timeframe, TimeframeAnalysis>(
    timeframes.map((t) => [t.timeframe, t]),
  );

  const t5m = tfMap.get("5m")?.trend;
  const t15m = tfMap.get("15m")?.trend;
  const t1h = tfMap.get("1h")?.trend;
  const t4h = tfMap.get("4h")?.trend;
  const t1D = tfMap.get("1D")?.trend;

  // 1. High conviction aligned bullish
  if (bullishCount >= 4 && bearishCount === 0) {
    const alignment: MultiTimeframeAlignment = {
      overallTrend: "bullish",
      alignedCount: bullishCount,
      alignmentStatus: "aligned bullish",
      timeframes,
    };
    return multiTimeframeAlignmentSchema.parse(alignment);
  }

  // 2. High conviction aligned bearish
  if (bearishCount >= 4 && bullishCount === 0) {
    const alignment: MultiTimeframeAlignment = {
      overallTrend: "bearish",
      alignedCount: bearishCount,
      alignmentStatus: "aligned bearish",
      timeframes,
    };
    return multiTimeframeAlignmentSchema.parse(alignment);
  }

  // 3. Timeframe transition check:
  // Short-term horizons (5m, 15m) running opposite to Higher-Timeframe anchors (4h, 1D).
  const isLtfBullish = t5m === "bullish" && t15m === "bullish";
  const isLtfBearish = t5m === "bearish" && t15m === "bearish";
  const isHtfBearish = t4h === "bearish" || t1D === "bearish";
  const isHtfBullish = t4h === "bullish" || t1D === "bullish";

  const isLtfReversalToBullish = isLtfBullish && isHtfBearish;
  const isLtfBreakdownToBearish = isLtfBearish && isHtfBullish;
  const isThreeVsTwo =
    (bullishCount === 3 && bearishCount === 2) ||
    (bearishCount === 3 && bullishCount === 2);

  if (isLtfReversalToBullish || isLtfBreakdownToBearish || isThreeVsTwo) {
    let overallTrend: TimeframeTrend;
    let alignedCount: number;

    if (bullishCount > bearishCount) {
      overallTrend = "bullish";
      alignedCount = bullishCount;
    } else if (bearishCount > bullishCount) {
      overallTrend = "bearish";
      alignedCount = bearishCount;
    } else {
      // Tie (e.g. 2 bullish, 2 bearish): HTF trend breaks the tie
      if (t1D === "bullish" || t4h === "bullish") {
        overallTrend = "bullish";
        alignedCount = bullishCount;
      } else if (t1D === "bearish" || t4h === "bearish") {
        overallTrend = "bearish";
        alignedCount = bearishCount;
      } else {
        overallTrend = "uncertain";
        alignedCount = 2;
      }
    }

    const alignment: MultiTimeframeAlignment = {
      overallTrend,
      alignedCount,
      alignmentStatus: "transitioning",
      timeframes,
    };
    return multiTimeframeAlignmentSchema.parse(alignment);
  }

  // 4. Dominant consolidation or uncertain market state
  if (
    uncertainCount >= 3 ||
    (uncertainCount + rangingCount >= 3 && bullishCount < 3 && bearishCount < 3)
  ) {
    const dominantTrend: TimeframeTrend = rangingCount >= uncertainCount ? "ranging" : "uncertain";
    const alignedCount = dominantTrend === "ranging" ? rangingCount : uncertainCount;

    const alignment: MultiTimeframeAlignment = {
      overallTrend: dominantTrend,
      alignedCount,
      alignmentStatus: "uncertain",
      timeframes,
    };
    return multiTimeframeAlignmentSchema.parse(alignment);
  }

  // 5. Mixed condition: conflicting signals without clear directional transition
  let mixedTrend: TimeframeTrend = "uncertain";
  let mixedAlignedCount = Math.max(bullishCount, bearishCount, rangingCount);

  if (bullishCount >= 3) {
    mixedTrend = "bullish";
    mixedAlignedCount = bullishCount;
  } else if (bearishCount >= 3) {
    mixedTrend = "bearish";
    mixedAlignedCount = bearishCount;
  } else if (rangingCount >= 2) {
    mixedTrend = "ranging";
    mixedAlignedCount = rangingCount;
  }

  const alignment: MultiTimeframeAlignment = {
    overallTrend: mixedTrend,
    alignedCount: mixedAlignedCount,
    alignmentStatus: "mixed",
    timeframes,
  };

  return multiTimeframeAlignmentSchema.parse(alignment);
}

export class AlignmentService {
  /**
   * Deterministically synthesizes independent timeframe analyses into an overall alignment.
   */
  public computeMultiTimeframeAlignment(
    timeframes: readonly TimeframeAnalysis[],
  ): MultiTimeframeAlignment {
    return computeMultiTimeframeAlignment(timeframes);
  }

  /**
   * Fetches independent timeframes, calculates indicators, synthesizes alignment,
   * and optionally persists snapshots to MongoDB.
   */
  public async getAlignment(symbol = "BTCUSDT"): Promise<MultiTimeframeAlignment> {
    const timeframes = await timeframeService.analyzeAllTimeframes(symbol);
    const alignment = computeMultiTimeframeAlignment(timeframes);

    // Asynchronously save snapshot audit trail without blocking return
    this.saveSnapshots(timeframes).catch((err: unknown) => {
      logger.debug("Background timeframe snapshot save skipped", "AlignmentService", {
        error: String(err),
      });
    });

    return alignment;
  }

  /**
   * Persists timeframe snapshots to MongoDB when available.
   */
  public async saveSnapshots(analyses: readonly TimeframeAnalysis[]): Promise<void> {
    try {
      await prisma.timeframeSnapshot.createMany({
        data: analyses.map((a) => ({
          timeframe: a.timeframe,
          price: a.price,
          rsi: a.rsi,
          ema20: a.ema20,
          ema50: a.ema50,
          atr: a.atr,
          volatility: a.volatility,
          trend: a.trend,
        })),
      });
    } catch (error: unknown) {
      logger.debug("Database snapshot write skipped (Prisma unavailable or offline)", "AlignmentService", {
        error: String(error),
      });
    }
  }
}

export const alignmentService = new AlignmentService();
