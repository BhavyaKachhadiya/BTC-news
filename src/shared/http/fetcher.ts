import { ProviderError } from "../errors/app-error";

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  providerName?: string;
}

export async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeoutMs = 10000, providerName = "HTTP", ...fetchInit } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchInit,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new ProviderError(
        providerName,
        `Request to ${url} failed with status ${response.status}: ${errorText.slice(0, 200)}`,
      );
    }

    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof ProviderError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderError(providerName, `Request to ${url} timed out after ${timeoutMs}ms`, error);
    }
    throw new ProviderError(
      providerName,
      `Network error connecting to ${url}: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

export async function fetchJson<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetchWithTimeout(url, options);
  try {
    const data: unknown = await response.json();
    return data as T;
  } catch (err: unknown) {
    throw new ProviderError(
      options.providerName ?? "HTTP",
      `Failed to parse JSON response from ${url}`,
      err,
    );
  }
}
