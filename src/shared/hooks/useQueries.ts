"use client";

import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { AnalysisPipelineOutput } from "@/features/analysis/services/orchestrator.service";
import type { PortfolioSummary } from "@/features/paper-trading/types/paper-trading.types";
import type { NewsItem } from "@/features/news/types/news.types";
import type { HistoricalSignalRecord } from "@/features/history/types/history.types";
import type { MultiTimeframeAlignment } from "@/features/multi-timeframe";
import type { WhaleIntelligenceSummary } from "@/features/whale-intelligence";
import type { DerivativesSnapshot } from "@/features/derivatives";
import type { MacroSnapshot } from "@/features/macro";
import type { SentimentTimelineSummary } from "@/features/news-sentiment";
import type { MarketStructureState } from "@/features/market-structure/types";
import type { SystemHealthSummary } from "@/features/monitoring/types/health.types";
import type { WebAlert } from "@/features/alerts/types/alert.types";
import type { EconomicCalendarSummary } from "@/features/macro/types/calendar.types";
import type { ExchangeFlowSummary } from "@/features/whale-intelligence/types/exchange-flow.types";
import type { SavedStrategyDto, CreateStrategyInput } from "@/features/strategy-lab/services/strategy-storage.service";

export interface AlertSummaryData {
  alerts: readonly WebAlert[];
  unreadCount: number;
}

// ==========================================
// 1. DASHBOARD & TAB QUERIES (ON-DEMAND & HOVER PREFETCH)
// ==========================================

export interface DashboardOverviewData {
  analysis: AnalysisPipelineOutput;
  portfolio: PortfolioSummary;
  news: readonly NewsItem[];
}

export interface DashboardAnalysisData {
  analysis: AnalysisPipelineOutput;
  portfolio: PortfolioSummary;
  news?: readonly NewsItem[];
}

export interface DerivativesMacroData {
  derivatives?: DerivativesSnapshot;
  macro?: MacroSnapshot;
}

export interface SentimentData {
  newsSentiment?: SentimentTimelineSummary;
  news: readonly NewsItem[];
}

// ------------------------------------------
// Raw API Fetchers (usable by both hooks and queryClient.prefetchQuery)
// ------------------------------------------

export async function fetchOverviewData(): Promise<DashboardOverviewData> {
  const res = await fetch("/api/analysis?scope=overview");
  if (!res.ok) throw new Error("Failed to fetch overview data");
  const json = await res.json();
  if (!json.success || !json.data) throw new Error(json.error || "Invalid response");
  return {
    analysis: json.data.analysis,
    portfolio: json.data.portfolio,
    news: json.data.news ?? [],
  };
}

export async function fetchTimeframeAlignment(): Promise<MultiTimeframeAlignment | null> {
  const res = await fetch("/api/timeframes").catch(() => null);
  if (!res || !res.ok) return null;
  const json = await res.json();
  return json.success && json.data ? json.data : null;
}

export async function fetchWhaleIntelligence(): Promise<WhaleIntelligenceSummary | null> {
  const res = await fetch("/api/whale").catch(() => null);
  if (!res || !res.ok) return null;
  const json = await res.json();
  return json.success && json.data ? json.data : null;
}

export async function fetchDerivativesMacro(): Promise<DerivativesMacroData> {
  const res = await fetch("/api/derivatives-macro").catch(() => null);
  if (!res || !res.ok) return {};
  const json = await res.json();
  return json.success && json.data ? json.data : {};
}

export async function fetchSentiment(): Promise<SentimentData> {
  const res = await fetch("/api/sentiment").catch(() => null);
  if (!res || !res.ok) return { news: [] };
  const json = await res.json();
  return json.success && json.data ? json.data : { news: [] };
}

export async function fetchMarketStructure(): Promise<MarketStructureState | null> {
  const res = await fetch("/api/market-structure").catch(() => null);
  if (!res || !res.ok) return null;
  const json = await res.json();
  return json.success && json.data ? json.data : null;
}

export async function fetchSignalsHistory(): Promise<readonly HistoricalSignalRecord[]> {
  const res = await fetch("/api/signals/history");
  if (!res.ok) throw new Error("Failed to fetch signal history");
  const json = await res.json();
  if (!json.success || !json.data) throw new Error(json.error || "Invalid response");
  return json.data;
}

export async function fetchSavedStrategies(): Promise<readonly SavedStrategyDto[]> {
  const res = await fetch("/api/strategies");
  if (!res.ok) return [];
  const json = await res.json();
  return json.success && Array.isArray(json.data) ? json.data : [];
}

export async function fetchSystemHealth(): Promise<SystemHealthSummary> {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error("Failed to fetch system health");
  const json = await res.json();
  if (!json.success || !json.data) throw new Error(json.error || "Health check failed");
  return json.data;
}

// ------------------------------------------
// Hover / Demand Prefetchers (TanStack Query)
// ------------------------------------------

export function prefetchOverview(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: ["analysis", "overview"],
    queryFn: fetchOverviewData,
    staleTime: 15_000,
  });
}

export function prefetchTimeframeAlignment(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: ["timeframes", "alignment"],
    queryFn: fetchTimeframeAlignment,
    staleTime: 30_000,
  });
}

export function prefetchWhale(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: ["whale", "intelligence"],
    queryFn: fetchWhaleIntelligence,
    staleTime: 20_000,
  });
}

export function prefetchDerivativesMacro(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: ["derivatives-macro", "snapshot"],
    queryFn: fetchDerivativesMacro,
    staleTime: 30_000,
  });
}

export function prefetchSentiment(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: ["sentiment", "timeline"],
    queryFn: fetchSentiment,
    staleTime: 30_000,
  });
}

export function prefetchMarketStructure(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: ["market-structure", "latest"],
    queryFn: fetchMarketStructure,
    staleTime: 60_000,
  });
}

export function prefetchSignalsHistory(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: ["signals", "history"],
    queryFn: fetchSignalsHistory,
    staleTime: 30_000,
  });
}

export function prefetchSavedStrategies(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: ["strategies", "saved"],
    queryFn: fetchSavedStrategies,
    staleTime: 30_000,
  });
}

export function prefetchSystemHealth(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: ["system", "health"],
    queryFn: fetchSystemHealth,
    staleTime: 15_000,
  });
}

// ------------------------------------------
// Core Hooks
// ------------------------------------------

/**
 * Fast Overview query: fetches ONLY overview data needed for immediate dashboard render.
 */
export function useOverviewQuery(options?: { enabled?: boolean }) {
  return useQuery<DashboardOverviewData>({
    queryKey: ["analysis", "overview"],
    queryFn: fetchOverviewData,
    staleTime: 15_000,
    refetchInterval: 30_000, // Background poll every 30s
    enabled: options?.enabled ?? true,
  });
}

export function useAnalysisQuery(options?: { enabled?: boolean }) {
  return useQuery<DashboardAnalysisData>({
    queryKey: ["analysis", "latest"],
    queryFn: async () => {
      const res = await fetch("/api/analysis?scope=overview");
      if (!res.ok) throw new Error("Failed to fetch analysis");
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || "Invalid response");
      return json.data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useNewsQuery(options?: { enabled?: boolean }) {
  return useQuery<readonly NewsItem[]>({
    queryKey: ["news", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || "Invalid response");
      return json.data;
    },
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useSignalsHistoryQuery(options?: { enabled?: boolean }) {
  return useQuery<readonly HistoricalSignalRecord[]>({
    queryKey: ["signals", "history"],
    queryFn: fetchSignalsHistory,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useTimeframeAlignmentQuery(options?: { enabled?: boolean }) {
  return useQuery<MultiTimeframeAlignment | null>({
    queryKey: ["timeframes", "alignment"],
    queryFn: fetchTimeframeAlignment,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useWhaleQuery(options?: { enabled?: boolean }) {
  return useQuery<WhaleIntelligenceSummary | null>({
    queryKey: ["whale", "intelligence"],
    queryFn: fetchWhaleIntelligence,
    staleTime: 20_000,
    enabled: options?.enabled ?? true,
  });
}

export function useDerivativesMacroQuery(options?: { enabled?: boolean }) {
  return useQuery<DerivativesMacroData>({
    queryKey: ["derivatives-macro", "snapshot"],
    queryFn: fetchDerivativesMacro,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useSentimentQuery(options?: { enabled?: boolean }) {
  return useQuery<SentimentData>({
    queryKey: ["sentiment", "timeline"],
    queryFn: fetchSentiment,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useMarketStructureQuery(options?: { enabled?: boolean }) {
  return useQuery<MarketStructureState | null>({
    queryKey: ["market-structure", "latest"],
    queryFn: fetchMarketStructure,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useEngineModeQuery() {
  return useQuery<"deterministic" | "jev">({
    queryKey: ["settings", "engineMode"],
    queryFn: async () => {
      const res = await fetch("/api/settings/mode");
      if (!res.ok) return "jev";
      const json = await res.json();
      return json.enableJev ? "jev" : "deterministic";
    },
    staleTime: 60_000,
  });
}

export function useSetEngineModeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mode: "deterministic" | "jev") => {
      const enableJev = mode === "jev";
      const res = await fetch("/api/settings/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enableJev }),
      });
      if (!res.ok) throw new Error("Failed to update engine mode");
      const json = await res.json();
      return json.enableJev ? "jev" : "deterministic";
    },
    onSuccess: (newMode) => {
      queryClient.setQueryData(["settings", "engineMode"], newMode);
      queryClient.invalidateQueries({ queryKey: ["analysis"] });
    },
  });
}

export function useTriggerAnalysisMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/analyze", { method: "POST" });
      if (!res.ok) throw new Error("Failed to trigger pipeline analysis");
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || "Pipeline failed");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analysis"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["timeframes"] });
    },
  });
}

// ==========================================
// 2. SYSTEM TELEMETRY / HEALTH QUERY
// ==========================================

export function useSystemHealthQuery() {
  return useQuery<SystemHealthSummary>({
    queryKey: ["system", "health"],
    queryFn: async () => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Failed to fetch system health");
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || "Health check failed");
      return json.data;
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

// ==========================================
// 3. ALERT ENGINE QUERY & MUTATIONS
// ==========================================

export function useAlertsQuery() {
  return useQuery<AlertSummaryData>({
    queryKey: ["alerts", "list"],
    queryFn: async () => {
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const json = await res.json();
      return {
        alerts: json.alerts || [],
        unreadCount: json.unreadCount || 0,
      };
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

export function useAcknowledgeAlertMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", alertId }),
      });
      if (!res.ok) throw new Error("Failed to acknowledge alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useMarkAllAlertsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (!res.ok) throw new Error("Failed to mark all alerts as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useClearAlertsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      if (!res.ok) throw new Error("Failed to clear alerts");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

// ==========================================
// 4. MACRO ECONOMIC CALENDAR QUERY
// ==========================================

export function useEconomicCalendarQuery() {
  return useQuery<EconomicCalendarSummary>({
    queryKey: ["macro", "calendar"],
    queryFn: async () => {
      const res = await fetch("/api/macro/calendar");
      if (!res.ok) throw new Error("Failed to fetch macro calendar");
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || "Calendar failed");
      return json.data;
    },
    staleTime: 60_000,
  });
}

// ==========================================
// 5. ON-CHAIN WHALE FLOWS QUERY
// ==========================================

export function useExchangeFlowsQuery() {
  return useQuery<ExchangeFlowSummary>({
    queryKey: ["whale", "flows"],
    queryFn: async () => {
      const res = await fetch("/api/whale/flows");
      if (!res.ok) throw new Error("Failed to fetch exchange flows");
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || "Flows failed");
      return json.data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

// ==========================================
// 6. STRATEGY LAB QUERIES & MUTATIONS
// ==========================================

export function useSavedStrategiesQuery() {
  return useQuery<readonly SavedStrategyDto[]>({
    queryKey: ["strategies", "saved"],
    queryFn: async () => {
      const res = await fetch("/api/strategies");
      if (!res.ok) return [];
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 15_000,
  });
}

export function useSaveStrategyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateStrategyInput) => {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save strategy");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Save failed");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
  });
}

export function useDeleteStrategyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (strategyId: string) => {
      const res = await fetch(`/api/strategies/${strategyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete strategy");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
  });
}
