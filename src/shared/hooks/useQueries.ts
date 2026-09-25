"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AnalysisPipelineOutput } from "@/features/analysis/services/orchestrator.service";
import type { PortfolioSummary } from "@/features/paper-trading/types/paper-trading.types";
import type { NewsItem } from "@/features/news/types/news.types";
import type { HistoricalSignalRecord } from "@/features/history/types/history.types";
import type { MultiTimeframeAlignment } from "@/features/multi-timeframe";
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
// 1. DASHBOARD & ANALYSIS QUERIES
// ==========================================

export interface DashboardAnalysisData {
  analysis: AnalysisPipelineOutput;
  portfolio: PortfolioSummary;
}

export function useAnalysisQuery() {
  return useQuery<DashboardAnalysisData>({
    queryKey: ["analysis", "latest"],
    queryFn: async () => {
      const res = await fetch("/api/analysis");
      if (!res.ok) throw new Error("Failed to fetch analysis");
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || "Invalid response");
      return json.data;
    },
    staleTime: 10_000,
    refetchInterval: 20_000, // Background poll every 20s
  });
}

export function useNewsQuery() {
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
  });
}

export function useSignalsHistoryQuery() {
  return useQuery<readonly HistoricalSignalRecord[]>({
    queryKey: ["signals", "history"],
    queryFn: async () => {
      const res = await fetch("/api/signals/history");
      if (!res.ok) throw new Error("Failed to fetch signal history");
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || "Invalid response");
      return json.data;
    },
    staleTime: 15_000,
  });
}

export function useTimeframeAlignmentQuery() {
  return useQuery<MultiTimeframeAlignment | null>({
    queryKey: ["timeframes", "alignment"],
    queryFn: async () => {
      const res = await fetch("/api/timeframes").catch(() => null);
      if (!res || !res.ok) return null;
      const json = await res.json();
      return json.success && json.data ? json.data : null;
    },
    staleTime: 10_000,
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
