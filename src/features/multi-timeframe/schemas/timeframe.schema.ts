import { z } from "zod";

export const timeframeSchema = z.enum(["5m", "15m", "1h", "4h", "1D"]);

export const timeframeTrendSchema = z.enum([
  "bullish",
  "bearish",
  "ranging",
  "uncertain",
]);

export const alignmentStatusSchema = z.enum([
  "aligned bullish",
  "aligned bearish",
  "mixed",
  "transitioning",
  "uncertain",
]);

/**
 * Validates a single raw kline tuple returned by Binance REST API.
 * [openTime, open, high, low, close, volume, closeTime, quoteAssetVolume, numberOfTrades, takerBuyBaseAssetVolume, takerBuyQuoteAssetVolume, ignore]
 */
export const binanceRawKlineSchema = z
  .tuple([
    z.number(), // 0: Open time
    z.string(), // 1: Open
    z.string(), // 2: High
    z.string(), // 3: Low
    z.string(), // 4: Close
    z.string(), // 5: Volume
  ])
  .rest(z.unknown());

export const binanceKlinesSchema = z.array(binanceRawKlineSchema);

export const timeframeAnalysisSchema = z.object({
  timeframe: timeframeSchema,
  price: z.number().positive(),
  rsi: z.number().min(0).max(100),
  ema20: z.number().positive(),
  ema50: z.number().positive(),
  atr: z.number().nonnegative(),
  volatility: z.number().nonnegative(),
  trend: timeframeTrendSchema,
});

export const multiTimeframeAlignmentSchema = z.object({
  overallTrend: timeframeTrendSchema,
  alignedCount: z.number().int().min(0).max(5),
  alignmentStatus: alignmentStatusSchema,
  timeframes: z.array(timeframeAnalysisSchema),
});

export type ValidatedTimeframeAnalysis = z.infer<typeof timeframeAnalysisSchema>;
export type ValidatedMultiTimeframeAlignment = z.infer<typeof multiTimeframeAlignmentSchema>;
export type ValidatedBinanceRawKline = z.infer<typeof binanceRawKlineSchema>;
