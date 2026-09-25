import type { BacktestCandle } from "../types/backtest.types";

/**
 * Deterministic PRNG for generating reproducible historical market scenarios.
 */
function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export type MarketScenario = "bull_run" | "choppy_range" | "bear_trend" | "full_cycle";

export interface ScenarioDefinition {
  readonly id: MarketScenario;
  readonly name: string;
  readonly days: number;
  readonly description: string;
}

export const MARKET_SCENARIOS: Record<MarketScenario, ScenarioDefinition> = {
  bull_run: {
    id: "bull_run",
    name: "90-Day Bull Momentum ($60k -> $95k)",
    days: 90,
    description: "Strong upward trend with intermittent pullbacks to test trend-following rules.",
  },
  choppy_range: {
    id: "choppy_range",
    name: "90-Day Ranging Chop ($62k - $68k)",
    days: 90,
    description: "Sideways consolidation regime ideal for mean reversion and tight stop losses.",
  },
  bear_trend: {
    id: "bear_trend",
    name: "90-Day Bear Correction ($90k -> $65k)",
    days: 90,
    description: "Sustained downward drift with relief rallies testing short setups and risk controls.",
  },
  full_cycle: {
    id: "full_cycle",
    name: "365-Day Complete Market Cycle",
    days: 365,
    description: "Full market cycle incorporating accumulation, parabolic run, blow-off, and reset.",
  },
};

/**
 * Generates deterministic realistic BTC price candles for a specific market regime.
 */
export function generateCandlesForScenario(
  scenario: MarketScenario,
  baseDate: Date = new Date("2026-01-01T00:00:00Z"),
): BacktestCandle[] {
  const def = MARKET_SCENARIOS[scenario];
  const count = def.days;
  const candles: BacktestCandle[] = [];
  const rand = pseudoRandom(1337 + count);

  let currentClose = 65000;
  if (scenario === "bull_run") currentClose = 60000;
  else if (scenario === "choppy_range") currentClose = 64000;
  else if (scenario === "bear_trend") currentClose = 90000;
  else if (scenario === "full_cycle") currentClose = 52000;

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(baseDate.getTime() + i * 86400000).toISOString();
    let drift = 0;

    if (scenario === "bull_run") {
      drift = 0.005 + (rand() - 0.45) * 0.03; // upward bias
    } else if (scenario === "bear_trend") {
      drift = -0.004 + (rand() - 0.55) * 0.03; // downward bias
    } else if (scenario === "choppy_range") {
      // Mean reversion pull toward 65000
      const diffFromMean = (65000 - currentClose) / 65000;
      drift = diffFromMean * 0.08 + (rand() - 0.5) * 0.025;
    } else {
      // Full cycle: 0-90 accumulation, 91-220 bull, 221-290 distribution, 291-365 bear
      if (i < 90) drift = (rand() - 0.49) * 0.02;
      else if (i < 220) drift = 0.004 + (rand() - 0.45) * 0.028;
      else if (i < 290) drift = (rand() - 0.52) * 0.03;
      else drift = -0.004 + (rand() - 0.54) * 0.028;
    }

    const open = currentClose;
    const change = open * drift;
    const tentativeClose = open + change;

    const volatility = 0.015 + rand() * 0.02;
    const high = Math.max(open, tentativeClose) * (1 + rand() * volatility);
    const low = Math.min(open, tentativeClose) * (1 - rand() * volatility);
    const close = tentativeClose;
    const volume = 20000 + Math.floor(rand() * 40000);

    currentClose = close;

    candles.push({
      timestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
  }

  return candles;
}
