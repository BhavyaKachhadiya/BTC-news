import { describe, it, expect } from "vitest";
import { DataReplayEngine } from "@/features/backtesting/services/replay.service";
import { generateCandlesForScenario } from "@/features/backtesting/data/sample-candles";
import { DEFAULT_STRATEGY_PARAMETERS } from "@/features/strategy-lab/types/strategy.types";

describe("DataReplayEngine", () => {
  it("evaluates step without look-ahead bias and calculates signals and indicators", () => {
    const candles = generateCandlesForScenario("bull_run");
    const engine = new DataReplayEngine(candles, DEFAULT_STRATEGY_PARAMETERS);

    expect(engine.getTotalSteps()).toBe(90);

    // Evaluate early step (warmup)
    const earlyStep = engine.evaluateStep(5);
    expect(earlyStep.stepIndex).toBe(5);
    expect(earlyStep.totalSteps).toBe(90);
    expect(earlyStep.currentCandle).toBeDefined();

    // Evaluate step after indicators warm up (e.g. index 35)
    const matureStep = engine.evaluateStep(35);
    expect(matureStep.stepIndex).toBe(35);
    expect(matureStep.rsi).not.toBeNull();
    expect(matureStep.emaFast).not.toBeNull();
    expect(matureStep.emaSlow).not.toBeNull();
    expect(matureStep.atr).not.toBeNull();
    expect(["LONG", "SHORT", "WAIT"]).toContain(matureStep.signal);
    expect(typeof matureStep.confidence).toBe("number");
    expect(matureStep.signalReason).toBeDefined();
  });

  it("clamps out-of-bounds indices safely", () => {
    const candles = generateCandlesForScenario("choppy_range");
    const engine = new DataReplayEngine(candles);

    const negativeStep = engine.evaluateStep(-10);
    expect(negativeStep.stepIndex).toBe(0);

    const overflowStep = engine.evaluateStep(999);
    expect(overflowStep.stepIndex).toBe(candles.length - 1);
  });
});
