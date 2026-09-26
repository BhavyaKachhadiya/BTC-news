export interface ADXResult {
  readonly adx: number;
  readonly plusDI: number;
  readonly minusDI: number;
}

/**
 * Calculates Average Directional Index (ADX), +DI, and -DI.
 *
 * @param prices Sequential closing prices (oldest first).
 * @param period Lookback window (default 14).
 */
export function calculateADX(prices: readonly number[], period = 14): ADXResult {
  if (!prices || prices.length < 3) {
    return { adx: 25, plusDI: 20, minusDI: 20 };
  }

  const effectivePeriod = Math.min(period, Math.max(prices.length - 2, 2));

  // Derive high, low, close approximations if only close prices are provided
  const highs: number[] = [];
  const lows: number[] = [];
  const closes: number[] = [...prices];

  for (let i = 0; i < prices.length; i++) {
    const p = prices[i];
    const prev = i > 0 ? prices[i - 1] : p;
    highs.push(Math.max(p, prev * 1.002));
    lows.push(Math.min(p, prev * 0.998));
  }

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const h = highs[i];
    const l = lows[i];
    const prevH = highs[i - 1];
    const prevL = lows[i - 1];
    const prevC = closes[i - 1];

    const currentTR = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
    tr.push(currentTR);

    const upMove = h - prevH;
    const downMove = prevL - l;

    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove);
    } else {
      plusDM.push(0);
    }

    if (downMove > upMove && downMove > 0) {
      minusDM.push(downMove);
    } else {
      minusDM.push(0);
    }
  }

  if (tr.length < effectivePeriod) {
    return { adx: 25, plusDI: 20, minusDI: 20 };
  }

  // Initial sum
  let trSum = tr.slice(0, effectivePeriod).reduce((a, b) => a + b, 0);
  let plusDMSum = plusDM.slice(0, effectivePeriod).reduce((a, b) => a + b, 0);
  let minusDMSum = minusDM.slice(0, effectivePeriod).reduce((a, b) => a + b, 0);

  const dxList: number[] = [];

  for (let i = effectivePeriod; i < tr.length; i++) {
    trSum = trSum - trSum / effectivePeriod + tr[i];
    plusDMSum = plusDMSum - plusDMSum / effectivePeriod + plusDM[i];
    minusDMSum = minusDMSum - minusDMSum / effectivePeriod + minusDM[i];

    const plusDI = trSum > 0 ? (plusDMSum / trSum) * 100 : 0;
    const minusDI = trSum > 0 ? (minusDMSum / trSum) * 100 : 0;
    const diSum = plusDI + minusDI;
    const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
    dxList.push(dx);
  }

  const lastPlusDI = trSum > 0 ? (plusDMSum / trSum) * 100 : 20;
  const lastMinusDI = trSum > 0 ? (minusDMSum / trSum) * 100 : 20;

  const adxVal =
    dxList.length > 0
      ? dxList.slice(-effectivePeriod).reduce((a, b) => a + b, 0) /
        Math.min(dxList.length, effectivePeriod)
      : 25;

  return {
    adx: Number(adxVal.toFixed(2)),
    plusDI: Number(lastPlusDI.toFixed(2)),
    minusDI: Number(lastMinusDI.toFixed(2)),
  };
}
