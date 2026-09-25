import { z } from "zod";

export const mempoolStatsSchema = z.object({
  count: z.number().nonnegative(),
  vsize: z.number().nonnegative(),
  total_fee: z.number().nonnegative(),
});

export const recommendedFeesSchema = z.object({
  fastestFee: z.number().nonnegative(),
  halfHourFee: z.number().nonnegative(),
  hourFee: z.number().nonnegative(),
  minimumFee: z.number().nonnegative().optional(),
});

export const networkDataSchema = z.object({
  blockHeight: z.number().positive(),
  txCount: z.number().nonnegative(),
  mempoolSize: z.number().nonnegative(),
  fastestFee: z.number().nonnegative(),
  halfHourFee: z.number().nonnegative(),
  hourFee: z.number().nonnegative(),
  timestamp: z.string().datetime(),
  provider: z.literal("mempool.space"),
});

export const networkAnomalyConfigSchema = z.object({
  txCountChangeThreshold: z.number().default(0.5), // 50% surge
  mempoolSizeChangeThreshold: z.number().default(0.5),
  feeSurgeThresholdSatVb: z.number().default(50), // fees above 50 sat/vB
  feeChangeRatioThreshold: z.number().default(1.0), // 100% surge
});

export type ValidatedNetworkData = z.infer<typeof networkDataSchema>;
