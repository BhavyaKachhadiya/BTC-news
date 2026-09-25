"use client";

import React from "react";
import { Zap, ChevronRight, Calculator, Bot } from "lucide-react";
import { SignalCard } from "@/features/signal/components/SignalCard";
import { MarketCard } from "@/features/market/components/MarketCard";
import { TechnicalCard } from "@/features/technical-analysis/components/TechnicalCard";
import { PaperTradingCard } from "@/features/paper-trading/components/PaperTradingCard";
import { JevCard } from "@/features/jev/components/JevCard";
import { NetworkCard } from "@/features/network/components/NetworkCard";
import { NewsFeed } from "@/features/news/components/NewsFeed";
import type { AnalysisPipelineOutput } from "@/features/analysis/services/orchestrator.service";
import type { PortfolioSummary } from "@/features/paper-trading/types/paper-trading.types";
import type { NewsItem } from "@/features/news/types/news.types";
import type { TabId } from "../../types/dashboard.types";

interface OverviewTabSectionProps {
  readonly pipelineData: AnalysisPipelineOutput;
  readonly portfolio: PortfolioSummary | null;
  readonly news: readonly NewsItem[];
  readonly isJevDegraded: boolean;
  readonly activeTab: TabId;
  readonly onFocusTab: (tab: TabId) => void;
}

export function OverviewTabSection({
  pipelineData,
  portfolio,
  news,
  isJevDegraded,
  activeTab,
  onFocusTab,
}: OverviewTabSectionProps) {
  return (
    <section className="space-y-6">
      {activeTab === "all" && (
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-btc-gold/10 text-btc-gold border border-btc-gold/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Layer 1 • Core Telemetry &amp; Primary Signal
              </h2>
              <p className="text-xs text-zinc-500">Live deterministic synthesis, technical indicators &amp; AI interpretation</p>
            </div>
          </div>
          <button
            onClick={() => onFocusTab("overview")}
            className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            Focus Tab <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
    </section>
  );
}
