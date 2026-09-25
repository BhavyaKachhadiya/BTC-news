import React from "react";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Gauge,
  Layers,
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";
import type { WhaleIntelligenceSummary } from "../types/whale.types";

export interface OnchainFlowsProps {
  summary: WhaleIntelligenceSummary;
}

export function OnchainFlows({ summary }: OnchainFlowsProps) {
  const {
    totalWhaleLongUsd,
    totalWhaleShortUsd,
    whaleBullRatio,
    largeTransactions,
    freshness,
  } = summary;

  const totalWhaleExposure = totalWhaleLongUsd + totalWhaleShortUsd;
  const bullPercentage = Number((whaleBullRatio * 100).toFixed(1));
  const bearPercentage = Number((100 - bullPercentage).toFixed(1));

  // Determine market positioning bias
  let biasLabel = "BALANCED / NEUTRAL";
  let biasBadgeColor = "bg-zinc-800 text-zinc-300 border-zinc-700";
  let BiasIcon = ShieldCheck;

  if (whaleBullRatio >= 0.58) {
    biasLabel = "STRONG BULLISH ACCUMULATION";
    biasBadgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    BiasIcon = TrendingUp;
  } else if (whaleBullRatio >= 0.52) {
    biasLabel = "MODERATE BULLISH BIAS";
    biasBadgeColor = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
    BiasIcon = TrendingUp;
  } else if (whaleBullRatio <= 0.42) {
    biasLabel = "HEAVY SHORT POSITIONING";
    biasBadgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    BiasIcon = TrendingDown;
  } else if (whaleBullRatio <= 0.48) {
    biasLabel = "MODERATE BEARISH SKEW";
    biasBadgeColor = "bg-rose-500/10 text-rose-300 border-rose-500/20";
    BiasIcon = TrendingDown;
  }

  // Aggregate mempool volume
  const totalLargeTxBtc = largeTransactions.reduce((acc, tx) => acc + tx.amountBtc, 0);
  const totalLargeTxUsd = largeTransactions.reduce((acc, tx) => acc + tx.amountUsd, 0);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
              On-Chain & Whale Flows
            </h2>
            <p className="text-xs text-zinc-500">Aggregate derivatives exposure & mempool transfers</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${biasBadgeColor}`}
          >
            <BiasIcon className="w-3.5 h-3.5" />
            {biasLabel}
          </span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Whale Bull Ratio Card */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Whale Bull Ratio</span>
            <Activity className="w-3.5 h-3.5 text-btc-gold" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {bullPercentage}%
          </div>
          <div className="text-[11px] text-zinc-500">
            {bullPercentage >= 50 ? "Long dominant" : "Short dominant"}
          </div>
        </div>

        {/* Total Long Exposure */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Whale Longs</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(totalWhaleLongUsd, 0)}
          </div>
          <div className="text-[11px] text-zinc-500">
            {formatPercent(bullPercentage, 1)} of total whale positions
          </div>
        </div>

        {/* Total Short Exposure */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Whale Shorts</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {formatCurrency(totalWhaleShortUsd, 0)}
          </div>
          <div className="text-[11px] text-zinc-500">
            {formatPercent(bearPercentage, 1)} of total whale positions
          </div>
        </div>
      </div>

      {/* Visual Sentiment Breakdown Bar */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300">Derivatives Positioning Breakdown</span>
          <span className="font-mono text-zinc-400">
            Total Monitored: {formatCurrency(totalWhaleExposure, 0)}
          </span>
        </div>

        <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
            style={{ width: `${bullPercentage}%` }}
          />
          <div
            className="bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-500"
            style={{ width: `${bearPercentage}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-emerald-400 font-semibold">{bullPercentage}% LONG</span>
          <span className="text-rose-400 font-semibold">{bearPercentage}% SHORT</span>
        </div>
      </div>

      {/* Mempool Large Flow Telemetry Card */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-btc-gold/10 text-btc-gold border border-btc-gold/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-zinc-400 font-medium">Recent Whale Mempool Volume (&gt; 10 BTC)</div>
            <div className="text-lg font-bold font-mono text-white">
              {totalLargeTxBtc.toFixed(2)} BTC{" "}
              <span className="text-xs text-zinc-400 font-normal">
                (≈ {formatCurrency(totalLargeTxUsd, 0)})
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-zinc-500">Data Freshness</div>
          <div className="text-xs font-mono text-zinc-300">{freshness}</div>
        </div>
      </div>
    </div>
  );
}
