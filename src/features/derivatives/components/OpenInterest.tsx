import React from "react";
import { Activity, Zap, ShieldCheck, Layers, DollarSign } from "lucide-react";
import { formatNumber, formatCurrency, formatPercent } from "@/shared/utils/formatters";

export interface OpenInterestProps {
  readonly openInterest?: number; // In BTC contracts
  readonly openInterestBtc?: number; // Alias for openInterest
  readonly openInterestUsd?: number; // In USD
  readonly isExpansion?: boolean;
  readonly changePercent?: number;
  readonly provider?: string;
  readonly timestamp?: number | string;
  readonly className?: string;
}

export function OpenInterest({
  openInterest,
  openInterestBtc,
  openInterestUsd,
  isExpansion = false,
  changePercent,
  provider = "binance",
  timestamp,
  className = "",
}: OpenInterestProps) {
  const activeOpenInterest = openInterest ?? openInterestBtc ?? 0;
  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
              Open Interest
            </h2>
            <div className="text-xs text-zinc-500">
              {provider === "hyperliquid" ? "Hyperliquid Perps" : "Binance BTCUSDT Futures"}
            </div>
          </div>
        </div>

        {isExpansion ? (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
            <Zap className="w-3.5 h-3.5" />
            OI Surge Detected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            OI Normal
          </span>
        )}
      </div>

      {/* Main Metric */}
      <div className="mt-5 space-y-4">
        <div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {formatNumber(Math.round(activeOpenInterest))} <span className="text-xl text-zinc-400 font-normal">BTC</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-xs text-zinc-500">Total Active Futures Commitment</div>
            {changePercent !== undefined && (
              <span
                className={`text-xs font-semibold ${
                  changePercent > 0 ? "text-emerald-400" : "text-zinc-400"
                }`}
              >
                ({formatPercent(changePercent)})
              </span>
            )}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
              Notional Value (USD)
            </div>
            <div className="text-sm font-semibold text-zinc-200">
              {openInterestUsd ? formatCurrency(openInterestUsd, 0) : "N/A"}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              Contract Type
            </div>
            <div className="text-sm font-semibold text-zinc-200">
              USD-Margined Linear
            </div>
          </div>
        </div>

        {/* Leverage / Risk Insight */}
        {isExpansion && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            Rapid leverage expansion observed: Sharp spikes in open interest often precede high-volatility liquidation flushes.
          </div>
        )}
      </div>
    </div>
  );
}
