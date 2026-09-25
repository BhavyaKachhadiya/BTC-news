import { z } from "zod";

export const newsItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url(),
  publishedAt: z.string().datetime(),
  source: z.string().optional(),
});

export const rawCryptoPanicPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string(),
  published_at: z.string(),
  source: z.object({
    title: z.string().optional(),
    domain: z.string().optional(),
  }).optional(),
});

export const cryptoPanicResponseSchema = z.object({
  results: z.array(rawCryptoPanicPostSchema),
});

export type ValidatedNewsItem = z.infer<typeof newsItemSchema>;
