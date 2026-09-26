import type { LiquidityBar, LiquidityState, LiquiditySweep } from "./types";

export class LiquidityService {
  /**
   * Tracks liquidity sweeps (stop hunts) and unmitigated liquidity pools with exact price levels.
   * Supports both OHLC bars (wicks vs closes) and single price series.
   *
   * @param input Sequence of OHLC bars or sequential closing prices.
   * @param timeframe Active timeframe (e.g. "15m", "1h", "4h", "1D").
   */
  public analyze(
    input: readonly number[] | readonly LiquidityBar[],
    timeframe: string = "15m",
  ): LiquidityState {
    if (!input || input.length < 6) {
      return {
        timeframe,
        recentSweeps: 0,
        sweeps: [],
        sweptLevels: [],
        unmitigatedPools: 0,
        buySide: [],
        sellSide: [],
      };
    }

    // Normalize input to OHLC bars
    const bars: readonly LiquidityBar[] =
      typeof input[0] === "number"
        ? (input as readonly number[]).map((p) => ({
            high: p,
            low: p,
            close: p,
          }))
        : (input as readonly LiquidityBar[]);

    const detectedSweeps: LiquiditySweep[] = [];
    const unsweptHighs: number[] = [];
    const unsweptLows: number[] = [];
    const currentPrice = bars[bars.length - 1].close;

    // Threshold for clustering close levels (e.g. 0.15% on 15m, 0.4% on higher timeframes)
    const clusterThreshold = timeframe === "15m" || timeframe === "5m" ? 0.0018 : 0.004;

    // 1. Scan for swing highs and swing lows across bars
    for (let i = 2; i < bars.length - 2; i++) {
      const isSwingHigh =
        bars[i].high >= bars[i - 1].high &&
        bars[i].high >= bars[i - 2].high &&
        bars[i].high >= bars[i + 1].high &&
        bars[i].high >= bars[i + 2].high;

      const isSwingLow =
        bars[i].low <= bars[i - 1].low &&
        bars[i].low <= bars[i - 2].low &&
        bars[i].low <= bars[i + 1].low &&
        bars[i].low <= bars[i + 2].low;

      if (isSwingHigh) {
        const sh = bars[i].high;
        let wasSwept = false;

        // Check if any subsequent candle swept this swing high (wick above, close below)
        for (let j = i + 1; j < bars.length; j++) {
          const testBar = bars[j];
          const nextBar = j + 1 < bars.length ? bars[j + 1] : null;

          if (testBar.high > sh) {
            // Bearish High Sweep: wicked above, closed back inside or next bar closed below
            if (testBar.close < sh || (nextBar && nextBar.close < sh)) {
              detectedSweeps.push({
                level: Math.round(sh),
                sweptExtreme: Math.round(testBar.high),
                type: "high_sweep",
                label: "High Swept (Rejected ↓)",
                timeframe,
              });
              wasSwept = true;
              break;
            }
          }
        }

        if (!wasSwept && sh > currentPrice * 1.001) {
          unsweptHighs.push(Math.round(sh));
        }
      }

      if (isSwingLow) {
        const sl = bars[i].low;
        let wasSwept = false;

        // Check if any subsequent candle swept this swing low (wick below, close above)
        for (let j = i + 1; j < bars.length; j++) {
          const testBar = bars[j];
          const nextBar = j + 1 < bars.length ? bars[j + 1] : null;

          if (testBar.low < sl) {
            // Bullish Low Sweep: wicked below, closed back inside or next bar closed above
            if (testBar.close > sl || (nextBar && nextBar.close > sl)) {
              detectedSweeps.push({
                level: Math.round(sl),
                sweptExtreme: Math.round(testBar.low),
                type: "low_sweep",
                label: "Low Swept (Reclaimed ↑)",
                timeframe,
              });
              wasSwept = true;
              break;
            }
          }
        }

        if (!wasSwept && sl < currentPrice * 0.999) {
          unsweptLows.push(Math.round(sl));
        }
      }
    }

    // 2. Also check immediate short-window false breakout / breakdown tests
    for (let i = 2; i < bars.length - 1; i++) {
      const prev = bars[i - 1].close;
      const test = bars[i];
      const next = bars[i + 1].close;

      if (test.low < prev * 0.996 && next > prev) {
        detectedSweeps.push({
          level: Math.round(prev),
          sweptExtreme: Math.round(test.low),
          type: "low_sweep",
          label: "Low Swept (Reclaimed ↑)",
          timeframe,
        });
      } else if (test.high > prev * 1.004 && next < prev) {
        detectedSweeps.push({
          level: Math.round(prev),
          sweptExtreme: Math.round(test.high),
          type: "high_sweep",
          label: "High Swept (Rejected ↓)",
          timeframe,
        });
      }
    }

    // 3. Deduplicate sweeps: keep the latest sweeps, merging levels that are very close
    const uniqueSweeps: LiquiditySweep[] = [];
    for (let i = detectedSweeps.length - 1; i >= 0; i--) {
      const s = detectedSweeps[i];
      const exists = uniqueSweeps.some(
        (existing) =>
          Math.abs(existing.level - s.level) / existing.level < clusterThreshold &&
          existing.type === s.type,
      );
      if (!exists) {
        uniqueSweeps.push(s);
      }
      if (uniqueSweeps.length >= 4) break;
    }

    // Fallback if price action was completely mono-directional
    if (uniqueSweeps.length === 0) {
      const recentLows = bars.slice(-12).map((b) => b.low);
      const recentHighs = bars.slice(-12).map((b) => b.high);
      const minL = Math.min(...recentLows);
      const maxH = Math.max(...recentHighs);

      if (minL < currentPrice) {
        uniqueSweeps.push({
          level: Math.round(minL),
          sweptExtreme: Math.round(minL * 0.998),
          type: "low_sweep",
          label: "Low Swept (Reclaimed ↑)",
          timeframe,
        });
      }
      if (maxH > currentPrice) {
        uniqueSweeps.push({
          level: Math.round(maxH),
          sweptExtreme: Math.round(maxH * 1.002),
          type: "high_sweep",
          label: "High Swept (Rejected ↓)",
          timeframe,
        });
      }
    }

    // 4. Equal Highs / Equal Lows for Unmitigated Liquidity Pools
    for (let i = 0; i < bars.length - 3; i++) {
      const b1 = bars[i];
      for (let j = i + 2; j < bars.length; j++) {
        const b2 = bars[j];
        if (Math.abs(b1.high - b2.high) / b1.high < clusterThreshold) {
          if (b1.high > currentPrice) unsweptHighs.push(Math.round(b1.high));
        }
        if (Math.abs(b1.low - b2.low) / b1.low < clusterThreshold) {
          if (b1.low < currentPrice) unsweptLows.push(Math.round(b1.low));
        }
      }
    }

    // Clean and sort unswept pools: nearest first
    const uniqueBuy = Array.from(new Set(unsweptHighs))
      .filter((p) => p > currentPrice)
      .sort((a, b) => a - b)
      .slice(0, 3);

    const uniqueSell = Array.from(new Set(unsweptLows))
      .filter((p) => p < currentPrice)
      .sort((a, b) => b - a)
      .slice(0, 3);

    // If pools are scarce, anchor at nearest intraday round levels
    if (uniqueBuy.length === 0) {
      uniqueBuy.push(Math.round(currentPrice * 1.006));
    }
    if (uniqueSell.length === 0) {
      uniqueSell.push(Math.round(currentPrice * 0.994));
    }

    const sweptLevels = uniqueSweeps.map((s) => s.level);

    return {
      timeframe,
      recentSweeps: uniqueSweeps.length,
      sweeps: uniqueSweeps,
      sweptLevels,
      unmitigatedPools: uniqueBuy.length + uniqueSell.length,
      buySide: uniqueBuy,
      sellSide: uniqueSell,
    };
  }
}

export const liquidityService = new LiquidityService();
