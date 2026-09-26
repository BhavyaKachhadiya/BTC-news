import type { OHLCBar } from "./atr";

export interface ElliottWavePoint {
  readonly wave: "1" | "2" | "3" | "4" | "5" | "A" | "B" | "C";
  readonly price: number;
  readonly index: number;
  readonly type: "peak" | "trough";
}

export interface ElliottWaveResult {
  readonly currentWave: "1" | "2" | "3" | "4" | "5" | "A" | "B" | "C" | "unknown";
  readonly phase: "motive" | "corrective" | "consolidation";
  readonly direction: "bullish" | "bearish" | "neutral";
  readonly waves: readonly ElliottWavePoint[];
  readonly projection: {
    readonly targetPrice: number;
    readonly description: string;
  };
}

/**
 * Calculates Elliott Wave impulse (1-2-3-4-5) and corrective (A-B-C) counts
 * based on swing pivots and Fibonacci extensions.
 *
 * @param prices Sequential closing prices or OHLC bars.
 */
export function calculateElliottWave(
  prices: readonly number[] | readonly OHLCBar[],
): ElliottWaveResult {
  const closePrices =
    prices.length > 0 && typeof prices[0] === "object"
      ? (prices as readonly OHLCBar[]).map((b) => b.close)
      : (prices as readonly number[]);

  if (closePrices.length < 15) {
    return {
      currentWave: "unknown",
      phase: "consolidation",
      direction: "neutral",
      waves: [],
      projection: {
        targetPrice: closePrices[closePrices.length - 1] ?? 0,
        description: "Insufficient price history for Elliott Wave cycle detection",
      },
    };
  }

  const currentPrice = closePrices[closePrices.length - 1];

  // 1. Identify key swing pivots (zigzag peaks and troughs)
  interface Pivot {
    index: number;
    price: number;
    type: "peak" | "trough";
  }

  const pivots: Pivot[] = [];
  const lookback = 3;

  for (let i = lookback; i < closePrices.length - lookback; i++) {
    const val = closePrices[i];
    let isPeak = true;
    let isTrough = true;

    for (let j = 1; j <= lookback; j++) {
      if (closePrices[i - j] >= val || closePrices[i + j] >= val) isPeak = false;
      if (closePrices[i - j] <= val || closePrices[i + j] <= val) isTrough = false;
    }

    if (isPeak) {
      // Alternate check
      if (pivots.length === 0 || pivots[pivots.length - 1].type !== "peak") {
        pivots.push({ index: i, price: val, type: "peak" });
      } else if (pivots.length > 0 && val > pivots[pivots.length - 1].price) {
        pivots[pivots.length - 1] = { index: i, price: val, type: "peak" };
      }
    } else if (isTrough) {
      if (pivots.length === 0 || pivots[pivots.length - 1].type !== "trough") {
        pivots.push({ index: i, price: val, type: "trough" });
      } else if (pivots.length > 0 && val < pivots[pivots.length - 1].price) {
        pivots[pivots.length - 1] = { index: i, price: val, type: "trough" };
      }
    }
  }

  // 2. Classify Motive vs Corrective sequences
  const recentPivots = pivots.slice(-6);
  const detectedWaves: ElliottWavePoint[] = [];

  const isBullishCycle =
    recentPivots.length >= 4 &&
    recentPivots[recentPivots.length - 1].price >= recentPivots[0].price;

  let currentWave: ElliottWaveResult["currentWave"] = "unknown";
  let phase: ElliottWaveResult["phase"] = "consolidation";
  let direction: ElliottWaveResult["direction"] = isBullishCycle ? "bullish" : "bearish";
  let targetPrice = currentPrice;
  let description = "Developing wave structure";

  if (recentPivots.length >= 5) {
    phase = "motive";
    const labels: Array<"1" | "2" | "3" | "4" | "5"> = ["1", "2", "3", "4", "5"];
    recentPivots.slice(0, 5).forEach((p, idx) => {
      detectedWaves.push({
        wave: labels[idx],
        price: p.price,
        index: p.index,
        type: p.type,
      });
    });

    currentWave = labels[Math.min(detectedWaves.length - 1, 4)];

    if (currentWave === "3") {
      targetPrice = Math.round(detectedWaves[2].price * (isBullishCycle ? 1.045 : 0.955));
      description = isBullishCycle
        ? "Wave 3 expansion active; major institutional momentum impulse"
        : "Wave 3 down impulse active; heavy institutional distribution";
    } else if (currentWave === "4") {
      targetPrice = Math.round(detectedWaves[1].price * (isBullishCycle ? 1.025 : 0.975));
      description = "Wave 4 consolidation pullback before final Wave 5 thrust";
    } else if (currentWave === "5") {
      targetPrice = Math.round(currentPrice * (isBullishCycle ? 0.96 : 1.04));
      phase = "corrective";
      description = "Wave 5 impulse exhaustion; prepare for A-B-C corrective rotation";
    }
  } else if (recentPivots.length >= 3) {
    phase = "corrective";
    const labels: Array<"A" | "B" | "C"> = ["A", "B", "C"];
    recentPivots.slice(0, 3).forEach((p, idx) => {
      detectedWaves.push({
        wave: labels[idx],
        price: p.price,
        index: p.index,
        type: p.type,
      });
    });
    currentWave = labels[detectedWaves.length - 1];
    targetPrice = Math.round(detectedWaves[0].price * (isBullishCycle ? 1.03 : 0.97));
    description = "A-B-C counter-trend correction in progress";
  } else {
    currentWave = "1";
    phase = "motive";
    targetPrice = Math.round(currentPrice * 1.03);
    description = "Wave 1 accumulation phase initiating";
  }

  return {
    currentWave,
    phase,
    direction,
    waves: detectedWaves,
    projection: {
      targetPrice,
      description,
    },
  };
}
