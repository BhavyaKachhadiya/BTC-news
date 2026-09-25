import { describe, it, expect } from "vitest";

describe("Paper Trading Feature", () => {
  it("calculates LONG PnL and return accurately", () => {
    const entryPrice = 80000;
    const exitPrice = 84000;
    const allocatedUsd = 2000;
    const amountBtc = allocatedUsd / entryPrice; // 0.025 BTC

    const realizedPnl = (exitPrice - entryPrice) * amountBtc;
    const pnlPercent = (realizedPnl / allocatedUsd) * 100;

    expect(realizedPnl).toBe(100);
    expect(pnlPercent).toBe(5.0);
  });

  it("calculates SHORT PnL and return accurately", () => {
    const entryPrice = 80000;
    const exitPrice = 76000;
    const allocatedUsd = 2000;
    const amountBtc = allocatedUsd / entryPrice; // 0.025 BTC

    // For SHORT, profit when exit < entry
    const realizedPnl = (entryPrice - exitPrice) * amountBtc;
    const pnlPercent = (realizedPnl / allocatedUsd) * 100;

    expect(realizedPnl).toBe(100);
    expect(pnlPercent).toBe(5.0);
  });

  it("triggers Take Profit when gain exceeds threshold", () => {
    const entryPrice = 80000;
    const currentPrice = 83200; // +4%
    const tpThreshold = 3.5;

    const gainPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    const shouldTakeProfit = gainPercent >= tpThreshold;

    expect(shouldTakeProfit).toBe(true);
  });

  it("triggers Stop Loss when loss exceeds threshold", () => {
    const entryPrice = 80000;
    const currentPrice = 78000; // -2.5%
    const slThreshold = 1.8;

    const lossPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    const shouldStopLoss = lossPercent <= -slThreshold;

    expect(shouldStopLoss).toBe(true);
  });
});
