"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  ShieldCheck,
  Zap,
  Layers,
  Users,
  Activity,
  MessageSquare,
  Sliders,
  History,
  Server,
  Maximize2,
  AlertCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useOverviewQuery,
  useTimeframeAlignmentQuery,
  useWhaleQuery,
  useDerivativesMacroQuery,
  useSentimentQuery,
  useMarketStructureQuery,
  useSignalsHistoryQuery,
  useEngineModeQuery,
  useSetEngineModeMutation,
  useTriggerAnalysisMutation,
  prefetchTimeframeAlignment,
  prefetchWhale,
  prefetchDerivativesMacro,
  prefetchSentiment,
  prefetchMarketStructure,
  prefetchSignalsHistory,
  prefetchSavedStrategies,
  prefetchSystemHealth,
} from "@/shared/hooks/useQueries";
import {
  DashboardHeader,
  DashboardTelemetryStrip,
  DashboardTabsNav,
  MultiStepLoader,
  OverviewTabSection,
  MultiTimeframeTabSection,
  MarketStructureTabSection,
  WhaleTabSection,
  DerivativesMacroTabSection,
  SentimentTabSection,
  BacktestTabSection,
  HistoryTabSection,
  HealthTabSection,
  type TabId,
  type TabItem,
} from "@/features/dashboard";

const VALID_TABS: readonly TabId[] = [
  "overview",
  "multi-timeframe",
  "market-structure",
  "whale",
  "derivatives-macro",
  "sentiment",
  "backtest",
  "history",
  "health",
  "all",
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showLoaderModal, setShowLoaderModal] = useState(false);
  const [marketStructureTimeframe, setMarketStructureTimeframe] = useState<string>("15m");
  const queryClient = useQueryClient();

  // 1. FAST INITIAL LOAD: Fetch ONLY the overview tab data first
  const overviewQuery = useOverviewQuery();
  const engineModeQuery = useEngineModeQuery();

  const setEngineModeMutation = useSetEngineModeMutation();
  const triggerAnalysisMutation = useTriggerAnalysisMutation();

  // URL Deep-linking (?tab=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as TabId | null;
      if (tabParam && VALID_TABS.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // 2. ON-DEMAND TAB QUERIES (Fetch ONLY when tab is active or "all")
  const isAll = activeTab === "all";

  const mtfQuery = useTimeframeAlignmentQuery({
    enabled: activeTab === "multi-timeframe" || isAll,
  });

  const whaleQuery = useWhaleQuery({
    enabled: activeTab === "whale" || isAll,
  });

  const derivMacroQuery = useDerivativesMacroQuery({
    enabled: activeTab === "derivatives-macro" || isAll,
  });

  const sentimentQuery = useSentimentQuery({
    enabled: activeTab === "sentiment" || isAll,
  });

  const marketStructureQuery = useMarketStructureQuery({
    enabled: activeTab === "market-structure" || isAll,
    timeframe: marketStructureTimeframe,
  });

  const historyQuery = useSignalsHistoryQuery({
    enabled: activeTab === "history" || isAll,
  });

  // 3. HOVER-TO-PREFETCH: TanStack Query prefetches data when user hovers any tab
  const handleTabHover = useCallback(
    (tabId: TabId) => {
      switch (tabId) {
        case "multi-timeframe":
          prefetchTimeframeAlignment(queryClient);
          break;
        case "whale":
          prefetchWhale(queryClient);
          break;
        case "derivatives-macro":
          prefetchDerivativesMacro(queryClient);
          break;
        case "sentiment":
          prefetchSentiment(queryClient);
          break;
        case "market-structure":
          prefetchMarketStructure(queryClient, marketStructureTimeframe);
          break;
        case "history":
          prefetchSignalsHistory(queryClient);
          break;
        case "backtest":
          prefetchSavedStrategies(queryClient);
          break;
        case "health":
          prefetchSystemHealth(queryClient);
          break;
        case "all":
          prefetchTimeframeAlignment(queryClient);
          prefetchWhale(queryClient);
          prefetchDerivativesMacro(queryClient);
          prefetchSentiment(queryClient);
          prefetchMarketStructure(queryClient);
          prefetchSignalsHistory(queryClient);
          prefetchSavedStrategies(queryClient);
          prefetchSystemHealth(queryClient);
          break;
        default:
          break;
      }
    },
    [queryClient],
  );

  // Overview Core Data
  const pipelineData = overviewQuery.data?.analysis ?? null;
  const portfolio = overviewQuery.data?.portfolio ?? null;
  const news = sentimentQuery.data?.news?.length
    ? sentimentQuery.data.news
    : overviewQuery.data?.news ?? [];

  // Tab Specific Data
  const history = historyQuery.data ?? [];
  const effectiveMtf = mtfQuery.data ?? pipelineData?.multiTimeframe ?? null;
  const whaleData = whaleQuery.data ?? pipelineData?.whale;
  const derivMacroData = derivMacroQuery.data;
  const derivatives = derivMacroData?.derivatives ?? pipelineData?.derivatives;
  const macro = derivMacroData?.macro ?? pipelineData?.macro;
  const newsSentiment = sentimentQuery.data?.newsSentiment ?? pipelineData?.newsSentiment;
  const marketStructure = marketStructureQuery.data ?? pipelineData?.marketStructure;

  const engineMode = engineModeQuery.data ?? "jev";
  const isJevDegraded =
    engineMode === "deterministic" || (pipelineData?.jev ? pipelineData.jev.isDegraded : true);

  const lastRefreshed = useMemo(() => {
    if (!overviewQuery.dataUpdatedAt) return "";
    return new Date(overviewQuery.dataUpdatedAt).toLocaleTimeString();
  }, [overviewQuery.dataUpdatedAt]);

  const handleModeToggle = useCallback(
    async (mode: "deterministic" | "jev") => {
      setShowLoaderModal(true);
      await setEngineModeMutation.mutateAsync(mode);
      await triggerAnalysisMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ["analysis"] });
    },
    [setEngineModeMutation, triggerAnalysisMutation, queryClient],
  );

  const handleTriggerAnalysis = useCallback(async () => {
    setShowLoaderModal(true);
    await triggerAnalysisMutation.mutateAsync();
    queryClient.invalidateQueries();
  }, [triggerAnalysisMutation, queryClient]);

  // Compute status badges for tabs
  const tabs = useMemo<readonly TabItem[]>(() => {
    const signalAction = pipelineData?.signal?.action;
    const signalConf = pipelineData?.signal?.confidence;
    const overviewBadge = signalAction ? `${signalAction} ${signalConf}%` : undefined;
    const overviewColor =
      signalAction === "LONG"
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        : signalAction === "SHORT"
        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
        : "bg-amber-500/20 text-amber-400 border border-amber-500/30";

    const mtfBadge = effectiveMtf ? `${effectiveMtf.alignedCount}/5 Aligned` : undefined;
    const mtfColor =
      effectiveMtf && effectiveMtf.alignedCount >= 4
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        : "bg-zinc-800 text-zinc-300 border border-zinc-700/60";

    const whaleRatio = whaleData?.whaleBullRatio;
    const whaleBadge =
      whaleRatio !== undefined
        ? `${Math.round(whaleRatio * 100)}% Bull`
        : whaleData?.topTraders
        ? `${whaleData.topTraders.length} Whales`
        : undefined;
    const whaleColor =
      whaleRatio !== undefined && whaleRatio >= 0.55
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        : whaleRatio !== undefined && whaleRatio <= 0.45
        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
        : "bg-zinc-800 text-zinc-300 border border-zinc-700/60";

    const dxyVal = macro?.dxy?.value;
    const derivMacroBadge = dxyVal !== undefined ? `DXY ${dxyVal.toFixed(1)}` : undefined;

    const sentimentCount =
      newsSentiment?.items.length ?? (news.length > 0 ? news.length : undefined);
    const sentimentBadge = sentimentCount !== undefined ? `${sentimentCount} News` : undefined;

    const historyBadge = history.length > 0 ? `${history.length} Logs` : undefined;

    return [
      {
        id: "overview",
        label: "Overview",
        icon: Zap,
        badge: overviewBadge,
        badgeColor: overviewColor,
      },
      {
        id: "multi-timeframe",
        label: "Multi-Timeframe",
        icon: Layers,
        badge: mtfBadge,
        badgeColor: mtfColor,
      },
      {
        id: "market-structure",
        label: "Market Structure & Edge",
        icon: Activity,
        badge: "Veteran",
        badgeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      },
      {
        id: "whale",
        label: "Whale & On-Chain",
        icon: Users,
        badge: whaleBadge,
        badgeColor: whaleColor,
      },
      {
        id: "derivatives-macro",
        label: "Derivatives & Macro",
        icon: Activity,
        badge: derivMacroBadge,
        badgeColor: "bg-zinc-800 text-zinc-300 border border-zinc-700/60",
      },
      {
        id: "sentiment",
        label: "Sentiment Timeline",
        icon: MessageSquare,
        badge: sentimentBadge,
        badgeColor: "bg-zinc-800 text-zinc-300 border border-zinc-700/60",
      },
      {
        id: "backtest",
        label: "Backtest & Lab",
        icon: Sliders,
        badge: "Lab",
        badgeColor: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
      },
      {
        id: "history",
        label: "Historical Decisions",
        icon: History,
        badge: historyBadge,
        badgeColor: "bg-zinc-800 text-zinc-300 border border-zinc-700/60",
      },
      {
        id: "health",
        label: "System Health",
        icon: Server,
        badge: "Telemetry",
        badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      },
      {
        id: "all",
        label: "View All",
        icon: Maximize2,
        badge: "Full Terminal",
        badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      },
    ];
  }, [pipelineData, effectiveMtf, whaleData, macro, newsSentiment, news.length, history.length]);

  // Show multi-step loader ONLY while overview is loading on initial visit
  if (overviewQuery.isLoading && !pipelineData) {
    return <MultiStepLoader isDataReady={!overviewQuery.isLoading && !!pipelineData} />;
  }

  const queryError =
    overviewQuery.error?.message ||
    triggerAnalysisMutation.error?.message ||
    setEngineModeMutation.error?.message ||
    null;

  return (
    <div className="min-h-screen bg-surface-900 text-zinc-100 flex flex-col selection:bg-btc-gold/20 selection:text-btc-gold relative">
      {/* Modal Loader Overlay */}
      {showLoaderModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm">
          <MultiStepLoader
            isDataReady={!triggerAnalysisMutation.isPending && !setEngineModeMutation.isPending}
            onComplete={() => setShowLoaderModal(false)}
          />
        </div>
      )}

      {/* Top Banner: Strict Paper Trading Notification */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-semibold text-amber-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 flex-shrink-0" />
        <span>
          PAPER TRADING / RESEARCH MODE ONLY • Zero live exchange connections • Never executes real trades
        </span>
      </div>

      {/* Main Navigation Header */}
      <DashboardHeader
        engineMode={engineMode}
        isModeLoading={setEngineModeMutation.isPending}
        isAnalyzing={triggerAnalysisMutation.isPending || overviewQuery.isFetching}
        lastRefreshed={lastRefreshed}
        isJevDegraded={isJevDegraded}
        pipelineDataLoaded={!!pipelineData}
        onModeToggle={handleModeToggle}
        onTriggerAnalysis={handleTriggerAnalysis}
      />

      {/* Realtime Telemetry Strip */}
      {pipelineData && (
        <DashboardTelemetryStrip
          pipelineData={{
            ...pipelineData,
            whale: whaleData ?? pipelineData.whale,
            derivatives: derivatives ?? pipelineData.derivatives,
            macro: macro ?? pipelineData.macro,
          }}
          isJevDegraded={isJevDegraded}
          effectiveMtf={effectiveMtf}
        />
      )}

      {/* Navigation Tab Bar with Hover-to-Prefetch */}
      <DashboardTabsNav
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onHoverTab={handleTabHover}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {queryError && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Notice:</span> {queryError}
            </div>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {(activeTab === "overview" || activeTab === "all") && pipelineData && (
          <OverviewTabSection
            pipelineData={pipelineData}
            portfolio={portfolio}
            news={news}
            isJevDegraded={isJevDegraded}
            activeTab={activeTab}
            onFocusTab={setActiveTab}
          />
        )}

        {/* 2. MULTI-TIMEFRAME TAB */}
        {(activeTab === "multi-timeframe" || activeTab === "all") && (
          <MultiTimeframeTabSection
            effectiveMtf={effectiveMtf}
            activeTab={activeTab}
            onFocusTab={setActiveTab}
          />
        )}

        {/* 2.5. MARKET STRUCTURE TAB */}
        {(activeTab === "market-structure" || activeTab === "all") && (
          <MarketStructureTabSection
            marketStructure={marketStructure}
            activeTab={activeTab}
            onFocusTab={setActiveTab}
            timeframe={marketStructureTimeframe}
            onSelectTimeframe={setMarketStructureTimeframe}
          />
        )}

        {/* 3. WHALE & ON-CHAIN TAB */}
        {(activeTab === "whale" || activeTab === "all") && (
          <WhaleTabSection
            whale={whaleData}
            activeTab={activeTab}
            onFocusTab={setActiveTab}
          />
        )}

        {/* 4. DERIVATIVES & MACRO TAB */}
        {(activeTab === "derivatives-macro" || activeTab === "all") && (
          <DerivativesMacroTabSection
            derivatives={derivatives}
            macro={macro}
            activeTab={activeTab}
            onFocusTab={setActiveTab}
          />
        )}

        {/* 5. SENTIMENT TIMELINE TAB */}
        {(activeTab === "sentiment" || activeTab === "all") && (
          <SentimentTabSection
            newsSentiment={newsSentiment}
            news={news}
            activeTab={activeTab}
            onFocusTab={setActiveTab}
          />
        )}

        {/* 6. STRATEGY LAB TAB */}
        {(activeTab === "backtest" || activeTab === "all") && (
          <BacktestTabSection activeTab={activeTab} onFocusTab={setActiveTab} />
        )}

        {/* 7. HISTORICAL DECISIONS TAB */}
        {(activeTab === "history" || activeTab === "all") && (
          <HistoryTabSection history={history} activeTab={activeTab} onFocusTab={setActiveTab} />
        )}

        {/* 8. SYSTEM HEALTH & TELEMETRY TAB */}
        {(activeTab === "health" || activeTab === "all") && (
          <HealthTabSection activeTab={activeTab} onFocusTab={setActiveTab} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-6 px-4 text-center text-xs text-zinc-500">
        SatoshiSignal™ • Architectural Principle: Jev interprets ambiguous qualitative context; TypeScript calculates deterministic indicators and final signals.
      </footer>
    </div>
  );
}
