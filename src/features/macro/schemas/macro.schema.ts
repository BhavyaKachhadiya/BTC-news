import { z } from "zod";

export const yahooChartMetaSchema = z
  .object({
    symbol: z.string().optional(),
    regularMarketPrice: z.number().nullable().optional(),
    chartPreviousClose: z.number().nullable().optional(),
    previousClose: z.number().nullable().optional(),
    regularMarketTime: z.number().nullable().optional(),
    currency: z.string().optional(),
  })
  .passthrough();

export const yahooQuoteIndicatorsSchema = z
  .object({
    close: z.array(z.number().nullable()).nullable().optional(),
    open: z.array(z.number().nullable()).nullable().optional(),
    high: z.array(z.number().nullable()).nullable().optional(),
    low: z.array(z.number().nullable()).nullable().optional(),
    volume: z.array(z.number().nullable()).nullable().optional(),
  })
  .passthrough();

export const yahooChartItemSchema = z
  .object({
    meta: yahooChartMetaSchema.optional(),
    timestamp: z.array(z.number()).nullable().optional(),
    indicators: z
      .object({
        quote: z.array(yahooQuoteIndicatorsSchema).nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

export const yahooChartResponseSchema = z
  .object({
    chart: z
      .object({
        result: z.array(yahooChartItemSchema).nullable().optional(),
        error: z.unknown().nullable().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type YahooChartResponse = z.infer<typeof yahooChartResponseSchema>;

export interface ExtractedYahooQuote {
  readonly symbol: string;
  readonly price: number;
  readonly previousClose: number;
  readonly changePercent: number;
  readonly timestamp: string;
}

/**
 * Extracts and normalizes price, previous close, and percentage change from Yahoo Finance chart responses.
 */
export function extractYahooChartQuote(data: unknown, fallbackSymbol = ""): ExtractedYahooQuote | null {
  const parsed = yahooChartResponseSchema.safeParse(data);
  if (!parsed.success) {
    return null;
  }

  const result = parsed.data.chart.result?.[0];
  if (!result) {
    return null;
  }

  const meta = result.meta;
  const symbol = meta?.symbol || fallbackSymbol;

  // Resolve current price
  let price: number | null = null;
  if (typeof meta?.regularMarketPrice === "number" && !Number.isNaN(meta.regularMarketPrice)) {
    price = meta.regularMarketPrice;
  } else {
    const closes = result.indicators?.quote?.[0]?.close;
    if (closes && Array.isArray(closes)) {
      for (let i = closes.length - 1; i >= 0; i--) {
        const val = closes[i];
        if (typeof val === "number" && !Number.isNaN(val)) {
          price = val;
          break;
        }
      }
    }
  }

  if (price === null) {
    return null;
  }

  // Resolve previous close
  let previousClose = price;
  if (typeof meta?.chartPreviousClose === "number" && !Number.isNaN(meta.chartPreviousClose) && meta.chartPreviousClose > 0) {
    previousClose = meta.chartPreviousClose;
  } else if (typeof meta?.previousClose === "number" && !Number.isNaN(meta.previousClose) && meta.previousClose > 0) {
    previousClose = meta.previousClose;
  } else {
    const closes = result.indicators?.quote?.[0]?.close;
    if (closes && Array.isArray(closes)) {
      const firstValid = closes.find((v): v is number => typeof v === "number" && !Number.isNaN(v));
      if (firstValid && firstValid > 0) {
        previousClose = firstValid;
      }
    }
  }

  const changePercent =
    previousClose > 0 ? Number((((price - previousClose) / previousClose) * 100).toFixed(2)) : 0;

  // Timestamp
  let timestamp = new Date().toISOString();
  if (typeof meta?.regularMarketTime === "number" && meta.regularMarketTime > 0) {
    timestamp = new Date(meta.regularMarketTime * 1000).toISOString();
  }

  return {
    symbol,
    price: Number(price.toFixed(4)),
    previousClose: Number(previousClose.toFixed(4)),
    changePercent,
    timestamp,
  };
}

export const dxyQuoteSchema = z.object({
  symbol: z.string(),
  value: z.number(),
  changePercent: z.number(),
  previousClose: z.number().optional(),
  timestamp: z.string(),
});

export const yieldsQuoteSchema = z.object({
  twoYear: z.number().optional(),
  tenYear: z.number().optional(),
  spread: z.number().optional(),
  timestamp: z.string(),
});

export const commodityQuoteSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  changePercent: z.number(),
  previousClose: z.number().optional(),
  timestamp: z.string(),
});

export const equitiesQuoteSchema = z.object({
  sp500: z.number().optional(),
  nasdaq: z.number().optional(),
  sp500ChangePercent: z.number().optional(),
  nasdaqChangePercent: z.number().optional(),
  timestamp: z.string(),
});

export const macroSnapshotSchema = z.object({
  timestamp: z.string(),
  dxy: z
    .object({
      value: z.number(),
      changePercent: z.number(),
    })
    .optional(),
  treasury: z
    .object({
      twoYear: z.number().optional(),
      tenYear: z.number().optional(),
    })
    .optional(),
  equities: z
    .object({
      sp500: z.number().optional(),
      nasdaq: z.number().optional(),
    })
    .optional(),
  gold: z
    .object({
      price: z.number(),
      changePercent: z.number(),
    })
    .optional(),
  freshness: z.enum(["available", "unavailable", "stale"]),
});

export type ValidatedMacroSnapshot = z.infer<typeof macroSnapshotSchema>;
