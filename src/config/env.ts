import { z } from "zod";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore if .env is absent in container / production environment
  }
}

const envSchema = z.object({
  DATABASE_URL: z.string().default("mongodb://localhost:27017/btc_signal_engine"),
  TYPESAFE_API_KEY: z.string().optional().default(""),
  OPENROUTER_API_KEY: z.string().optional().default(""),
  ENABLE_JEV: z
    .preprocess(
      (v) => (v === undefined || v === "" ? true : v === "false" || v === "0" ? false : Boolean(v)),
      z.boolean(),
    )
    .default(true),
  COINGECKO_API_KEY: z.string().optional().default(""),
  NEWS_API_KEY: z.string().optional().default(""),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ANALYSIS_INTERVAL_MINUTES: z.coerce.number().positive().default(5),
  PAPER_STARTING_BALANCE: z.coerce.number().positive().default(10000),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment configuration");
  }
  return result.data;
}

export const env = validateEnv();
