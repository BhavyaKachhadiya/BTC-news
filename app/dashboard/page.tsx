"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Play,
  RotateCw,
  ShieldCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowLeft,
  AlertCircle,
  Users,
  Activity,
  Globe,
  MessageSquare,
  Sliders,
  History,
  Maximize2,
  Sparkles,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Clock,
  Bot,
  Calculator,
  Server,
} from "lucide-react";
import { MarketCard } from "@/features/market/components/MarketCard";
import { TechnicalCard } from "@/features/technical-analysis/components/TechnicalCard";
import { JevCard } from "@/features/jev/components/JevCard";
import { SignalCard } from "@/features/signal/components/SignalCard";
import { NetworkCard } from "@/features/network/components/NetworkCard";
import { NewsFeed } from "@/features/news/components/NewsFeed";
import { PaperTradingCard } from "@/features/paper-trading/components/PaperTradingCard";
import { HistoryTable } from "@/features/history/components/HistoryTable";
import { TimeframeOverview, TimeframeSignal } from "@/features/multi-timeframe";
import { WhaleActivity, LargeTransactions, OnchainFlows } from "@/features/whale-intelligence";
import { FundingRate, OpenInterest, LongShortRatio } from "@/features/derivatives";
import { MacroOverview, DxyCard, YieldCard, EconomicCalendarCard } from "@/features/macro";
import { SentimentTimeline, NewsImpactChart } from "@/features/news-sentiment";
import { BacktestLab } from "@/features/backtesting";
import { HealthStatusWidget } from "@/features/monitoring";
import { WebNotificationBell } from "@/features/alerts";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";
import type { AnalysisPipelineOutput } from "@/features/analysis/services/orchestrator.service";
import type { PortfolioSummary } from "@/features/paper-trading/types/paper-trading.types";
import type { HistoricalSignalRecord } from "@/features/history/types/history.types";
import type { NewsItem } from "@/features/news/types/news.types";
import type { MultiTimeframeAlignment } from "@/features/multi-timeframe";

type TabId =
  | "overview"
  | "multi-timeframe"
  | "whale"
  | "derivatives-macro"
  | "sentiment"
  | "backtest"
  | "history"
  | "health"
  | "all";

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export default function DashboardPage() {
  const [pipelineData, setPipelineData] = useState<AnalysisPipelineOutput | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [news, setNews] = useState<readonly NewsItem[]>([]);
  const [history, setHistory] = useState<readonly HistoricalSignalRecord[]>([]);
  const [timeframeAlignment, setTimeframeAlignment] = useState<MultiTimeframeAlignment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [engineMode, setEngineMode] = useState<"deterministic" | "jev">("jev");
  const [isModeLoading, setIsModeLoading] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [analysisRes, newsRes, historyRes, timeframesRes] = await Promise.all([
        fetch("/api/analysis"),
        fetch("/api/news"),
        fetch("/api/signals/history"),
        fetch("/api/timeframes").catch(() => null),
      ]);

      if (analysisRes.ok) {
        const json = await analysisRes.json();
        if (json.success && json.data) {
          setPipelineData(json.data.analysis);
          setPortfolio(json.data.portfolio);
        }
      }

      if (newsRes.ok) {
        const json = await newsRes.json();
        if (json.success && json.data) {
          setNews(json.data);
        }
      }

      if (historyRes.ok) {
        const json = await historyRes.json();
        if (json.success && json.data) {
          setHistory(json.data);
        }
      }

      if (timeframesRes && timeframesRes.ok) {
        const json = await timeframesRes.json();
        if (json.success && json.data) {
          setTimeframeAlignment(json.data);
        }
      }

      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const json = await res.json();
      if (json.success && json.data) {
        setPipelineData(json.data);
        // Refresh portfolio & history after new analysis
        await fetchDashboardData();
      } else {
        setError(json.error ?? "Analysis pipeline failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to execute pipeline");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Default 5-minute analysis polling interval
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Fetch current engine mode on mount
  useEffect(() => {
    void fetch("/api/settings/mode")
      .then((r) => r.json() as Promise<{ enableJev: boolean }>)
      .then((data) => {
        setEngineMode(data.enableJev ? "jev" : "deterministic");
      })
      .catch(() => {
        // keep default 'jev'
      });
  }, []);

  const handleModeToggle = useCallback(
    async (mode: "deterministic" | "jev") => {
      if (mode === engineMode || isModeLoading) return;
      setIsModeLoading(true);
      try {
        await fetch("/api/settings/mode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enableJev: mode === "jev" }),
        });
        setEngineMode(mode);
        // Re-run analysis immediately with the new mode
        setIsAnalyzing(true);
        const res = await fetch("/api/analyze", { method: "POST" });
        const json = await res.json();
        if (json.success && json.data) {
          setPipelineData(json.data);
          await fetchDashboardData();
        }
      } catch {
        // revert on failure — keep current mode
      } finally {
        setIsModeLoading(false);
        setIsAnalyzing(false);
      }
    },
    [engineMode, isModeLoading, fetchDashboardData],
  );

  const effectiveMtf = pipelineData?.multiTimeframe ?? timeframeAlignment;
  const isJevDegraded = engineMode === "deterministic" || (pipelineData?.jev ? pipelineData.jev.isDegraded : true);

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

    const mtfBadge = effectiveMtf
      ? `${effectiveMtf.alignedCount}/5 Aligned`
      : undefined;
    const mtfColor =
      effectiveMtf && effectiveMtf.alignedCount >= 4
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        : "bg-zinc-800 text-zinc-300 border border-zinc-700/60";

    const whaleRatio = pipelineData?.whale?.whaleBullRatio;
    const whaleBadge =
      whaleRatio !== undefined
        ? `${Math.round(whaleRatio * 100)}% Bull`
        : pipelineData?.whale
        ? `${pipelineData.whale.topTraders.length} Whales`
        : undefined;
    const whaleColor =
      whaleRatio !== undefined && whaleRatio >= 0.55
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        : whaleRatio !== undefined && whaleRatio <= 0.45
        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
        : "bg-zinc-800 text-zinc-300 border border-zinc-700/60";

    const dxyVal = pipelineData?.macro?.dxy?.value;
    const derivMacroBadge = dxyVal !== undefined ? `DXY ${dxyVal.toFixed(1)}` : undefined;

    const sentimentCount = pipelineData?.newsSentiment?.items.length ?? (news.length > 0 ? news.length : undefined);
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
  }, [pipelineData, effectiveMtf, news.length, history.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-900 text-zinc-300">
        <div className="p-4 rounded-2xl bg-surface-800/80 border border-zinc-800 flex flex-col items-center max-w-md w-full text-center space-y-4 shadow-2xl">
          <RotateCw className="w-10 h-10 animate-spin text-btc-gold" />
          <div>
            <div className="text-base font-bold text-white tracking-tight">
              Connecting to BTC Intelligence Engine...
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Synchronizing CoinGecko, Mempool, Binance, Hyperliquid, Yahoo Finance & News feeds
            </div>
          </div>
          <div className="w-full space-y-2 pt-2">
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full bg-btc-gold animate-pulse w-3/4 rounded-full" />
            </div>
            <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Initializing deterministic synthesis pipelines
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900 text-zinc-100 flex flex-col selection:bg-btc-gold/20 selection:text-btc-gold">
      {/* Top Banner: Strict Paper Trading Notification */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-semibold text-amber-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 flex-shrink-0" />
        <span>
          PAPER TRADING / RESEARCH MODE ONLY • Zero live exchange connections • Never executes real trades
        </span>
      </div>

      {/* Main Navigation Header */}
      <header className="border-b border-zinc-800 bg-surface-800/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Return Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-lg font-bold text-white tracking-tight">
                  BTC Signal Engine
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-btc-gold/15 text-btc-gold border border-btc-gold/30 font-semibold">
                  QUANT WORKSTATION v2.0
                </span>
                {pipelineData && (
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${
                      !isJevDegraded
                        ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                        : "bg-btc-gold/15 text-btc-gold border-btc-gold/40"
                    }`}
                    title={
                      !isJevDegraded
                        ? "OpenRouter Decisions API (~typesafe/jev-latest) actively interpreting qualitative news and context"
                        : "Zero AI / Math & On-Chain Only: 100% deterministic indicators (EMAs, RSI, MACD, MTF, Whale, Derivatives)"
                    }
                  >
                    {!isJevDegraded ? (
                      <>
                        <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Mode: Jev AI Assisted (OpenRouter)</span>
                      </>
                    ) : (
                      <>
                        <Calculator className="w-3.5 h-3.5 text-btc-gold" />
                        <span>Mode: Pure Deterministic (Math Only)</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Autonomous Quantitative Telemetry • Jev Qualitative Interpretation • Multi-Horizon Deterministic Synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Updated: {lastRefreshed}</span>
              </div>
            )}

            {/* Engine Mode Toggle */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => void handleModeToggle("deterministic")}
                disabled={isModeLoading}
                title="Pure Deterministic Mode — zero AI, 100% math (EMA, RSI, MTF, Whale, Derivatives)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer ${
                  engineMode === "deterministic"
                    ? "bg-btc-gold/20 text-btc-gold border border-btc-gold/40 shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                {isModeLoading && engineMode !== "deterministic" ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Calculator className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">Math Only</span>
              </button>

              <button
                onClick={() => void handleModeToggle("jev")}
                disabled={isModeLoading}
                title="Jev AI Assisted Mode — OpenRouter ~typesafe/jev-latest"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer ${
                  engineMode === "jev"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                {isModeLoading && engineMode !== "jev" ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">Jev AI</span>
              </button>
            </div>

            {/* Web Alert Notification Bell */}
            <WebNotificationBell />

            <button
              onClick={triggerAnalysis}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-btc-gold hover:bg-btc-accent text-black font-semibold text-xs tracking-wide transition-all shadow-md shadow-btc-gold/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Running Pipeline...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Analysis Now
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Bloomberg-Style Realtime Telemetry Strip */}
      {pipelineData && (
        <div className="bg-surface-800/95 border-b border-zinc-800/80 px-4 sm:px-8 py-2 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-4 text-xs whitespace-nowrap">
            {/* Live BTC Price */}
            <div className="flex items-center gap-2 pr-4 border-r border-zinc-800">
              <span className="font-mono text-zinc-400">BTC/USD:</span>
              <span className="font-bold text-white font-mono">
                {formatCurrency(pipelineData.market.price)}
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  pipelineData.market.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatPercent(pipelineData.market.change24h)}
              </span>
            </div>

            {/* Signal */}
            <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
              <span className="text-zinc-500">Signal:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  pipelineData.signal.action === "LONG"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : pipelineData.signal.action === "SHORT"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {pipelineData.signal.action} ({pipelineData.signal.confidence}%)
              </span>
            </div>

            {/* Engine Mode */}
            <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
              <span className="text-zinc-500">Mode:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  !isJevDegraded
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    : "bg-btc-gold/20 text-btc-gold border-btc-gold/40"
                }`}
              >
                {!isJevDegraded ? (
                  <>
                    <Bot className="w-3 h-3 text-cyan-400" />
                    Jev AI Assisted (OpenRouter)
                  </>
                ) : (
                  <>
                    <Calculator className="w-3 h-3 text-btc-gold" />
                    Pure Deterministic (Math Only)
                  </>
                )}
              </span>
            </div>

            {/* MTF */}
            {effectiveMtf && (
              <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
                <span className="text-zinc-500">MTF:</span>
                <span className="text-zinc-200 capitalize font-medium">
                  {effectiveMtf.overallTrend} ({effectiveMtf.alignedCount}/5)
                </span>
              </div>
            )}

            {/* Whale Positioning */}
            {pipelineData.whale && (
              <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
                <span className="text-zinc-500">Whale Bias:</span>
                <span
                  className={`font-semibold ${
                    pipelineData.whale.whaleBullRatio >= 0.55
                      ? "text-emerald-400"
                      : pipelineData.whale.whaleBullRatio <= 0.45
                      ? "text-rose-400"
                      : "text-zinc-300"
                  }`}
                >
                  {Math.round(pipelineData.whale.whaleBullRatio * 100)}% Bull
                </span>
              </div>
            )}

            {/* Funding Rate */}
            {pipelineData.derivatives && (
              <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
                <span className="text-zinc-500">Funding:</span>
                <span
                  className={`font-mono ${
                    pipelineData.derivatives.fundingRate > 0.03
                      ? "text-rose-400 font-bold"
                      : pipelineData.derivatives.fundingRate < 0
                      ? "text-emerald-400 font-bold"
                      : "text-zinc-300"
                  }`}
                >
                  {pipelineData.derivatives.fundingRate > 0 ? "+" : ""}
                  {pipelineData.derivatives.fundingRate.toFixed(4)}%
                </span>
              </div>
            )}

            {/* DXY */}
            {pipelineData.macro?.dxy && (
              <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
                <span className="text-zinc-500">DXY:</span>
                <span className="font-mono text-zinc-200">
                  {pipelineData.macro.dxy.value.toFixed(2)}
                </span>
                <span
                  className={`text-[10px] ${
                    pipelineData.macro.dxy.changePercent < 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {formatPercent(pipelineData.macro.dxy.changePercent)}
                </span>
              </div>
            )}

            {/* 10Y Yield */}
            {pipelineData.macro?.treasury?.tenYear && (
              <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
                <span className="text-zinc-500">10Y Yield:</span>
                <span className="font-mono text-zinc-200">
                  {pipelineData.macro.treasury.tenYear.toFixed(2)}%
                </span>
              </div>
            )}

            {/* Network Gas/Fees */}
            {pipelineData.network && (
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">Fast Fee:</span>
                <span className="font-mono text-zinc-200">
                  {pipelineData.network.fastestFee} sat/vB
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* High-Convenience Navigation Tab Bar */}
      <nav className="sticky top-[57px] z-40 bg-surface-900/95 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-btc-gold text-black shadow-md shadow-btc-gold/20"
                      : "bg-surface-800 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800/80"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-zinc-400"}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                        isActive
                          ? "bg-black/20 text-black border border-black/20"
                          : tab.badgeColor ?? "bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center gap-2 text-xs text-zinc-500 whitespace-nowrap">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Terminal Active</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Notice:</span> {error}
            </div>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {(activeTab === "overview" || activeTab === "all") && (
          <section className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-btc-gold/10 text-btc-gold border border-btc-gold/20">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Layer 1 • Core Telemetry & Primary Signal
                    </h2>
                    <p className="text-xs text-zinc-500">Live deterministic synthesis, technical indicators & AI interpretation</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("overview")}
                  className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  Focus Tab <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {pipelineData && (
              <>
                {/* Primary Signal Display */}
                <SignalCard signal={pipelineData.signal} />

                {/* Engine Mode Operational Status Banner */}
                {isJevDegraded ? (
                  <div className="p-4 rounded-2xl bg-btc-gold/10 border border-btc-gold/30 text-xs text-zinc-300 flex items-start gap-3 shadow-lg">
                    <div className="p-2.5 rounded-xl bg-btc-gold/20 text-btc-gold border border-btc-gold/30 flex-shrink-0 mt-0.5">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                          Mode: Pure Deterministic (Math &amp; On-Chain Only) Active
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Zero AI Dependency
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed">
                        Signals are calculated 100% deterministically from EMAs, RSI, Multi-Timeframe, Hyperbot Whales, and Derivatives without external AI dependency.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs text-zinc-300 flex items-start gap-3 shadow-lg">
                    <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0 mt-0.5">
                      <Bot className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                          Mode: Jev AI Assisted (OpenRouter Decisions API ~typesafe/jev-latest) Active
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          Qualitative Synthesis Active
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed">
                        High-impact breaking news and qualitative market context are interpreted by Jev via OpenRouter before being synthesized into deterministic signal weights.
                      </p>
                    </div>
                  </div>
                )}

                {/* Feature Grid: 2 Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Column 1: Market & Technicals & Paper Trading */}
                  <div className="space-y-6">
                    <MarketCard market={pipelineData.market} />
                    <TechnicalCard technicals={pipelineData.technicals} />
                    {portfolio && (
                      <PaperTradingCard
                        portfolio={portfolio}
                        btcPrice={pipelineData.market.price}
                      />
                    )}
                  </div>

                  {/* Column 2: Jev AI & Network & News */}
                  <div className="space-y-6">
                    <JevCard jev={pipelineData.jev} />
                    <NetworkCard
                      network={pipelineData.network}
                      anomaly={pipelineData.anomaly}
                    />
                    <NewsFeed news={news} />
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* 2. MULTI-TIMEFRAME TAB */}
        {(activeTab === "multi-timeframe" || activeTab === "all") && (
          <section className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Layer 2 • Multi-Timeframe Alignment
                    </h2>
                    <p className="text-xs text-zinc-500">5-horizon trend confirmation from 5m scalping to 1d macro trend</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("multi-timeframe")}
                  className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  Focus Tab <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {effectiveMtf ? (
              <div className="space-y-6">
                <TimeframeSignal alignment={effectiveMtf} />
                <TimeframeOverview alignment={pipelineData?.multiTimeframe ?? timeframeAlignment} />
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-8 text-center text-zinc-400">
                Multi-timeframe alignment data is initializing. Run analysis to fetch live horizons.
              </div>
            )}
          </section>
        )}

        {/* 3. WHALE & ON-CHAIN TAB */}
        {(activeTab === "whale" || activeTab === "all") && (
          <section className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Layer 3 • Whale & On-Chain Intelligence
                    </h2>
                    <p className="text-xs text-zinc-500">Hyperliquid top 20 whale traders, net positioning, and mempool transfers &gt; 10 BTC</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("whale")}
                  className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  Focus Tab <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {pipelineData && (
              <div className="space-y-6">
                {/* OnchainFlows Summary - rendered if whale summary is present */}
                {pipelineData.whale && (
                  <OnchainFlows summary={pipelineData.whale} />
                )}

                {/* Whale Activity & Large Transactions Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <WhaleActivity
                    topTraders={pipelineData.whale?.topTraders ?? []}
                    totalWhaleLongUsd={pipelineData.whale?.totalWhaleLongUsd}
                    totalWhaleShortUsd={pipelineData.whale?.totalWhaleShortUsd}
                    whaleBullRatio={pipelineData.whale?.whaleBullRatio}
                    freshness={pipelineData.whale?.freshness}
                  />
                  <LargeTransactions
                    transactions={pipelineData.whale?.largeTransactions ?? []}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* 4. DERIVATIVES & MACRO TAB */}
        {(activeTab === "derivatives-macro" || activeTab === "all") && (
          <section className="space-y-8">
            {activeTab === "all" && (
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Layer 4 • Derivatives & Macroeconomic Dynamics
                    </h2>
                    <p className="text-xs text-zinc-500">Perpetual funding spikes, open interest expansions, and cross-asset liquidity telemetry</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("derivatives-macro")}
                  className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  Focus Tab <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {pipelineData && (
              <>
                {/* Derivatives Sub-Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Derivatives Market Structure
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Binance &amp; Hyperliquid Perps
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FundingRate
                      fundingRate={pipelineData.derivatives?.fundingRate ?? 0}
                      isSpike={pipelineData.derivatives?.eventFlags?.isFundingSpike}
                    />
                    <OpenInterest
                      openInterestBtc={pipelineData.derivatives?.openInterest}
                    />
                    <LongShortRatio
                      ratio={pipelineData.derivatives?.longShortRatio ?? 1.0}
                    />
                  </div>
                </div>

                {/* Macro Sub-Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Macro &amp; Monetary Regime
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      DXY, US Treasury Yields &amp; S&amp;P 500
                    </span>
                  </div>

                  {pipelineData.macro && (
                    <MacroOverview snapshot={pipelineData.macro} />
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DxyCard
                      quote={
                        pipelineData.macro?.dxy
                          ? {
                              value: pipelineData.macro.dxy.value,
                              changePercent: pipelineData.macro.dxy.changePercent,
                              timestamp: pipelineData.macro.timestamp,
                            }
                          : undefined
                      }
                    />
                    <YieldCard
                      quote={
                        pipelineData.macro?.treasury
                          ? {
                              twoYear: pipelineData.macro.treasury.twoYear,
                              tenYear: pipelineData.macro.treasury.tenYear,
                              timestamp: pipelineData.macro.timestamp,
                            }
                          : undefined
                      }
                    />
                  </div>

                  {/* Economic Calendar & Upcoming Major Catalysts */}
                  <EconomicCalendarCard />
                </div>
              </>
            )}
          </section>
        )}

        {/* 5. SENTIMENT TIMELINE TAB */}
        {(activeTab === "sentiment" || activeTab === "all") && (
          <section className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Layer 5 • News Sentiment &amp; Resolved Price Impact
                    </h2>
                    <p className="text-xs text-zinc-500">Timeline of high-impact headlines with resolved 1h, 4h, and 24h market price shifts</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("sentiment")}
                  className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  Focus Tab <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {pipelineData && (
              <div className="space-y-6">
                <NewsImpactChart items={pipelineData.newsSentiment?.items ?? []} />

                {pipelineData.newsSentiment ? (
                  <SentimentTimeline summary={pipelineData.newsSentiment} />
                ) : (
                  <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6">
                    <NewsFeed news={news} />
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 6. STRATEGY LAB TAB */}
        {(activeTab === "backtest" || activeTab === "all") && (
          <section className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Backtesting &amp; Strategy Parameter Sweep Lab
                    </h2>
                    <p className="text-xs text-zinc-500">Historical simulation engine with multi-timeframe confirmation &amp; Monte Carlo risk models</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("backtest")}
                  className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  Focus Tab <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <BacktestLab />
          </section>
        )}

        {/* 7. HISTORICAL DECISIONS TAB */}
        {(activeTab === "history" || activeTab === "all") && (
          <section className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Historical Pipeline Decisions &amp; Signal Log
                    </h2>
                    <p className="text-xs text-zinc-500">Auditable chronological ledger of all deterministic actions &amp; hit rates</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("history")}
                  className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  Focus Tab <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <HistoryTable history={history} />
          </section>
        )}

        {/* 8. SYSTEM HEALTH & TELEMETRY TAB */}
        {(activeTab === "health" || activeTab === "all") && (
          <section className="space-y-6">
            {activeTab === "all" && (
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      System Health, Latency &amp; Data Freshness
                    </h2>
                    <p className="text-xs text-zinc-500">Live operational monitoring of all 6 external data feeds and database connection</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("health")}
                  className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  Focus Tab <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <HealthStatusWidget />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-6 px-4 text-center text-xs text-zinc-500">
        BTC Signal Engine • Architectural Principle: Jev interprets ambiguous qualitative context; TypeScript calculates deterministic indicators and final signals.
      </footer>
    </div>
  );
}
