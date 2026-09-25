import { z } from "zod";

export const coinGeckoSimplePriceSchema = z.object({
  bitcoin: z.object({
    usd: z.number().positive(),
    usd_24h_change: z.number().nullish().default(0),
    usd_24h_vol: z.number().nullish().default(0),
    usd_market_cap: z.number().nullish().default(0),
  }),
});

export const coinGeckoMarketChartSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])).min(1),
  total_volumes: z.array(z.tuple([z.number(), z.number()])).optional(),
});

export const marketDataSchema = z.object({
  price: z.number().positive(),
  change24h: z.number(),
  volume24h: z.number().nonnegative(),
  marketCap: z.number().nonnegative(),
  high24h: z.number().optional(),
  low24h: z.number().optional(),
  timestamp: z.string().datetime(),
  provider: z.literal("coingecko"),
});

export type ValidatedMarketData = z.infer<typeof marketDataSchema>;
