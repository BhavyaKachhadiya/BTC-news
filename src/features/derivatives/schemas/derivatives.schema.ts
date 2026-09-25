import { z } from "zod";

// Binance Funding Rate
export const binanceFundingRateItemSchema = z.object({
  symbol: z.string(),
  fundingTime: z.number(),
  fundingRate: z.string(),
  markPrice: z.string().optional(),
  rateType: z.string().optional(),
});

export const binanceFundingRateResponseSchema = z.array(binanceFundingRateItemSchema);

export type BinanceFundingRateItem = z.infer<typeof binanceFundingRateItemSchema>;
export type BinanceFundingRateResponse = z.infer<typeof binanceFundingRateResponseSchema>;

// Binance Open Interest
export const binanceOpenInterestSchema = z.object({
  symbol: z.string(),
  openInterest: z.string(),
  time: z.number(),
});

export type BinanceOpenInterest = z.infer<typeof binanceOpenInterestSchema>;

// Binance Global Long/Short Ratio
export const binanceLongShortRatioItemSchema = z.object({
  symbol: z.string(),
  longAccount: z.string(),
  shortAccount: z.string(),
  longShortRatio: z.string(),
  timestamp: z.number(),
});

export const binanceLongShortRatioResponseSchema = z.array(binanceLongShortRatioItemSchema);

export type BinanceLongShortRatioItem = z.infer<typeof binanceLongShortRatioItemSchema>;
export type BinanceLongShortRatioResponse = z.infer<typeof binanceLongShortRatioResponseSchema>;

// Hyperliquid metaAndAssetCtxs
export const hyperliquidUniverseItemSchema = z
  .object({
    name: z.string(),
    szDecimals: z.number(),
    maxLeverage: z.number().optional(),
    marginTableId: z.number().optional(),
    isDelisted: z.boolean().optional(),
  })
  .passthrough();

export const hyperliquidAssetCtxItemSchema = z
  .object({
    funding: z.string().nullish(),
    openInterest: z.string().nullish(),
    prevDayPx: z.string().nullish(),
    dayNtlVlm: z.string().nullish(),
    premium: z.string().nullish(),
    oraclePx: z.string().nullish(),
    markPx: z.string().nullish(),
    midPx: z.string().nullish(),
    dayBaseVlm: z.string().nullish(),
  })
  .passthrough();

export const hyperliquidMetaAndAssetCtxsSchema = z.tuple([
  z
    .object({
      universe: z.array(hyperliquidUniverseItemSchema),
    })
    .passthrough(),
  z.array(hyperliquidAssetCtxItemSchema),
]);

export type HyperliquidUniverseItem = z.infer<typeof hyperliquidUniverseItemSchema>;
export type HyperliquidAssetCtxItem = z.infer<typeof hyperliquidAssetCtxItemSchema>;
export type HyperliquidMetaAndAssetCtxs = z.infer<typeof hyperliquidMetaAndAssetCtxsSchema>;
