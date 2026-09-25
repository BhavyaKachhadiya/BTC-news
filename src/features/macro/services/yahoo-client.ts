import { fetchJson } from "@/shared/http/fetcher";
import { logger } from "@/shared/logger/logger";
import { extractYahooChartQuote, type ExtractedYahooQuote } from "../schemas/macro.schema";

export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export const DEFAULT_MACRO_TIMEOUT_MS = 6000;

export interface YahooFetchOptions {
  readonly timeoutMs?: number;
  readonly userAgent?: string;
  readonly range?: string;
  readonly interval?: string;
}

/**
 * Robust HTTP client for Yahoo Finance chart endpoints with User-Agent spoofing,
 * multi-host fallback (query1 -> query2), and timeout handling.
 */
export async function fetchYahooChart(
  symbol: string,
  options: YahooFetchOptions = {},
): Promise<ExtractedYahooQuote | null> {
  const {
    timeoutMs = DEFAULT_MACRO_TIMEOUT_MS,
    userAgent = DEFAULT_USER_AGENT,
    range = "1d",
    interval = "1d",
  } = options;

  const hosts = [
    "https://query1.finance.yahoo.com",
    "https://query2.finance.yahoo.com",
  ];

  let lastError: unknown = null;

  for (const host of hosts) {
    const encodedSymbol = encodeURIComponent(symbol);
    const url = `${host}/v8/finance/chart/${encodedSymbol}?range=${range}&interval=${interval}`;

    try {
      logger.debug(`Fetching Yahoo chart quote for ${symbol} from ${host}`, "YahooClient");

      const raw = await fetchJson<unknown>(url, {
        timeoutMs,
        providerName: `YahooFinance-${symbol}`,
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      const extracted = extractYahooChartQuote(raw, symbol);
      if (extracted) {
        return extracted;
      }
    } catch (err: unknown) {
      lastError = err;
      logger.debug(`Attempt from ${host} failed for ${symbol}: ${String(err)}`, "YahooClient");
    }
  }

  logger.warn(`Failed to fetch Yahoo Finance quote for ${symbol} from all endpoints`, "YahooClient", {
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });

  return null;
}
