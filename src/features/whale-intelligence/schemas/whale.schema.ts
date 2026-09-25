import { z } from "zod";

/**
 * Coerces string or number values into a safe floating-point number,
 * defaulting empty/null/undefined or NaN to a fallback value.
 */
const safeCoerceNumber = (defaultValue = 0) =>
  z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return defaultValue;
    if (typeof val === "number") return Number.isNaN(val) ? defaultValue : val;
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return Number.isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  }, z.number());

/**
 * Individual trader schema from Hyperbot / Hyperliquid Discover API
 */
export const hyperbotTraderSchema = z.object({
  address: z.string(),
  winRate: safeCoerceNumber(0),
  totalPnl: safeCoerceNumber(0),
  longPnl: safeCoerceNumber(0),
  shortPnl: safeCoerceNumber(0),
  avgLeverage: safeCoerceNumber(1),
  snapLongPositionValue: safeCoerceNumber(0),
  snapShortPositionValue: safeCoerceNumber(0),
  snapLongPositionCount: safeCoerceNumber(0),
  snapShortPositionCount: safeCoerceNumber(0),
  snapTotalValue: safeCoerceNumber(0),
  // Optional metadata returned by discovery endpoint
  longWinRate: safeCoerceNumber(0).optional(),
  shortWinRate: safeCoerceNumber(0).optional(),
  sharpe: safeCoerceNumber(0).optional(),
  ddDrawdown: safeCoerceNumber(0).optional(),
  snapPerpValue: safeCoerceNumber(0).optional(),
  snapPositionCount: safeCoerceNumber(0).optional(),
  snapEffLeverage: safeCoerceNumber(1).optional(),
  snapPositionValue: safeCoerceNumber(0).optional(),
  snapMarginUsageRate: safeCoerceNumber(0).optional(),
  snapTotalMarginUsed: safeCoerceNumber(0).optional(),
  snapUnrealizedPnl: safeCoerceNumber(0).optional(),
});

export type HyperbotTraderParsed = z.infer<typeof hyperbotTraderSchema>;

/**
 * Hyperbot Discover API envelope response schema.
 * Handles wrapped object with { data: { list: [...] } }, { data: [...] },
 * { list: [...] }, or a flat array.
 */
export const hyperbotDiscoverResponseSchema = z.union([
  z.object({
    code: z.union([z.string(), z.number()]).optional(),
    msg: z.string().optional(),
    data: z.union([
      z.object({
        list: z.array(hyperbotTraderSchema),
        total: z.number().optional(),
      }),
      z.array(hyperbotTraderSchema),
    ]),
  }),
  z.object({
    list: z.array(hyperbotTraderSchema),
    total: z.number().optional(),
  }),
  z.array(hyperbotTraderSchema),
]);

export type HyperbotDiscoverResponseParsed = z.infer<typeof hyperbotDiscoverResponseSchema>;

/**
 * Mempool recent transaction schema from https://mempool.space/api/mempool/recent
 */
export const mempoolRecentTxSchema = z.object({
  txid: z.string().min(1, "txid must not be empty"),
  fee: z.number().nonnegative(),
  vsize: z.number().positive(),
  value: z.number().nonnegative(),
});

export const mempoolRecentTxsSchema = z.array(mempoolRecentTxSchema);

export type MempoolRecentTxParsed = z.infer<typeof mempoolRecentTxSchema>;
