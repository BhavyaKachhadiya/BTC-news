import { z } from "zod";

export const marketRegimeSchema = z.enum(["bullish", "bearish", "ranging", "uncertain"]);
export const newsDirectionSchema = z.enum(["bullish", "bearish", "neutral"]);

export const jevAnalysisResultSchema = z.object({
  marketRegime: marketRegimeSchema,
  regimeConfidence: z.number().min(0).max(1),
  newsDirection: newsDirectionSchema,
  newsImpactScore: z.number().min(0).max(10), // Normalized score 0-10
  setupQualityScore: z.number().min(0).max(10), // Normalized score 0-10
  networkAnomalyScore: z.number().min(0).max(1), // noul probability 0-1
  isNetworkAnomaly: z.boolean(),
  summary: z.string(),
  isDegraded: z.boolean().default(false),
  degradedReason: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type ValidatedJevResult = z.infer<typeof jevAnalysisResultSchema>;
