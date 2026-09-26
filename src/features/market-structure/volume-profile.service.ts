import type { VolumeProfileState } from "./types";

export class VolumeProfileService {
  /**
   * Generates Volume Profile distribution (Point of Control, Value Area High, Value Area Low).
   *
   * @param prices Array of sequential closing prices.
   * @param volumes Optional corresponding volumes.
   * @param bins Number of horizontal price buckets (default 24).
   */
  public analyze(
    prices: readonly number[],
    volumes?: readonly number[],
    bins = 24,
  ): VolumeProfileState {
    if (!prices || prices.length === 0) {
      return { poc: 0, vah: 0, val: 0 };
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return { poc: minPrice, vah: minPrice, val: minPrice };
    }

    const binSize = (maxPrice - minPrice) / bins;
    const binVolumes = new Array<number>(bins).fill(0);
    const binPrices = new Array<number>(bins).fill(0);

    for (let b = 0; b < bins; b++) {
      binPrices[b] = minPrice + (b + 0.5) * binSize;
    }

    // Accumulate volume into bins
    let totalVolume = 0;
    for (let i = 0; i < prices.length; i++) {
      const p = prices[i];
      const v = volumes && volumes[i] ? volumes[i] : 100;
      const binIdx = Math.min(Math.floor((p - minPrice) / binSize), bins - 1);
      binVolumes[binIdx] += v;
      totalVolume += v;
    }

    // Identify Point of Control (POC) = bin with max volume
    let maxVol = -1;
    let pocIdx = 0;
    for (let b = 0; b < bins; b++) {
      if (binVolumes[b] > maxVol) {
        maxVol = binVolumes[b];
        pocIdx = b;
      }
    }
    const poc = binPrices[pocIdx];

    // Determine 70% Value Area around POC
    const targetVolume = totalVolume * 0.7;
    let currentVAvolume = binVolumes[pocIdx];
    let lowIdx = pocIdx;
    let highIdx = pocIdx;

    while (currentVAvolume < targetVolume && (lowIdx > 0 || highIdx < bins - 1)) {
      const nextLowVol = lowIdx > 0 ? binVolumes[lowIdx - 1] : -1;
      const nextHighVol = highIdx < bins - 1 ? binVolumes[highIdx + 1] : -1;

      if (nextHighVol >= nextLowVol && highIdx < bins - 1) {
        highIdx++;
        currentVAvolume += binVolumes[highIdx];
      } else if (lowIdx > 0) {
        lowIdx--;
        currentVAvolume += binVolumes[lowIdx];
      } else if (highIdx < bins - 1) {
        highIdx++;
        currentVAvolume += binVolumes[highIdx];
      } else {
        break;
      }
    }

    return {
      poc: Math.round(poc),
      vah: Math.round(binPrices[highIdx]),
      val: Math.round(binPrices[lowIdx]),
    };
  }
}

export const volumeProfileService = new VolumeProfileService();
