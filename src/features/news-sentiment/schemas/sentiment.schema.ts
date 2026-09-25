import { z } from "zod";

export const newsSentimentSchema = z.enum(["bullish", "bearish", "neutral", "mixed"]);

export const newsImpactSchema = z.enum(["negligible", "low", "moderate", "high", "exceptional"]);

export const sentimentNewsItemSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required"),
  source: z.string().optional(),
  publishedAt: z.string().min(1, "publishedAt date string is required"),
  url: z.string().min(1, "URL is required"),
  sentiment: newsSentimentSchema,
  impact: newsImpactSchema,
  score: z.number().min(-10).max(10),
  btcPriceAtPub: z.number().positive().optional(),
  btcPriceAfter1h: z.number().positive().nullable().optional(),
  btcPriceAfter4h: z.number().positive().nullable().optional(),
  btcPriceAfter24h: z.number().positive().nullable().optional(),
});

export const sentimentTimelineSummarySchema = z.object({
  items: z.array(sentimentNewsItemSchema),
  overallSentiment: newsSentimentSchema,
  averageImpactScore: z.number().min(0).max(10),
});

export type SentimentNewsItemInput = z.infer<typeof sentimentNewsItemSchema>;
export type SentimentTimelineSummaryInput = z.infer<typeof sentimentTimelineSummarySchema>;
