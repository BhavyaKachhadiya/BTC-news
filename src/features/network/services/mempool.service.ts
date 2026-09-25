import { fetchJson, fetchWithTimeout } from "@/shared/http/fetcher";
import { ProviderError, ValidationError } from "@/shared/errors/app-error";
import { logger } from "@/shared/logger/logger";
import {
  mempoolStatsSchema,
  recommendedFeesSchema,
} from "../schemas/network.schema";
import type { NetworkData, NetworkProvider } from "../types/network.types";

export class MempoolService implements NetworkProvider {
  private readonly baseUrl: string;

  constructor(baseUrl = "https://mempool.space/api") {
    this.baseUrl = baseUrl;
  }

  public async getCurrentNetworkData(): Promise<NetworkData> {
    logger.debug("Fetching Bitcoin mempool and network state", "MempoolService");

    try {
      // Fetch mempool stats, recommended fees, and block height concurrently
      const [statsRaw, feesRaw, heightRes] = await Promise.all([
        fetchJson(`${this.baseUrl}/mempool`, { timeoutMs: 10000, providerName: "mempool.space" }),
        fetchJson(`${this.baseUrl}/v1/fees/recommended`, { timeoutMs: 10000, providerName: "mempool.space" }),
        fetchWithTimeout(`${this.baseUrl}/blocks/tip/height`, { timeoutMs: 10000, providerName: "mempool.space" }),
      ]);

      const statsParsed = mempoolStatsSchema.safeParse(statsRaw);
      if (!statsParsed.success) {
        throw new ValidationError("Invalid mempool stats format", statsParsed.error.issues);
      }

      const feesParsed = recommendedFeesSchema.safeParse(feesRaw);
      if (!feesParsed.success) {
        throw new ValidationError("Invalid recommended fees format", feesParsed.error.issues);
      }

      const heightText = await heightRes.text();
      const blockHeight = Number.parseInt(heightText.trim(), 10);
      if (Number.isNaN(blockHeight) || blockHeight <= 0) {
        throw new ValidationError(`Invalid block height: ${heightText}`);
      }

      return {
        blockHeight,
        txCount: statsParsed.data.count,
        mempoolSize: statsParsed.data.vsize,
        fastestFee: feesParsed.data.fastestFee,
        halfHourFee: feesParsed.data.halfHourFee,
        hourFee: feesParsed.data.hourFee,
        timestamp: new Date().toISOString(),
        provider: "mempool.space",
      };
    } catch (error: unknown) {
      logger.error("Failed to fetch network state from mempool.space", "MempoolService", {
        error: String(error),
      });
      throw error;
    }
  }
}

export const mempoolService = new MempoolService();
