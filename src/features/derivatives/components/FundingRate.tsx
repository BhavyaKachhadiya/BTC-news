import React from "react";
import { Percent, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { formatPercent, formatCurrency } from "@/shared/utils/formatters";

export interface FundingRateProps {
  readonly fundingRate: number; // In percent, e.g. 0.01 = 0.01%
  readonly isSpike?: boolean;
  readonly markPrice?: number;
  readonly provider?: string;
  readonly fundingTime?: number | string;
  readonly className?: string;
}

export function FundingRate({
  fundingRate,
  isSpike = false,
  markPrice,
  provider = "binance",
  fundingTime,
  className = "",
}: FundingRateProps) {
  const isPositive = fundingRate > 0;
  const isOverheated = fundingRate > 0.03;
  const isDiscount = fundingRate < -0.01;

  // Clamped bar position between 0% and 100% (mapping -0.05%..+0.05% to 0%..100%)
  const clampedRate = Math.max(-0.05, Math.min(0.05, fundingRate));
  const progressPercent = ((clampedRate - (-0.05)) / 0.1) * 100;

  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
              Funding Rate (8h)
            </h2>
            <div className="text-xs text-zinc-500">
              {provider === "hyperliquid" ? "Hyperliquid Perps (8h Eq)" : "Binance USDⓈ-M Perps"}
            </div>
          </div>
        </div>

        {isSpike ? (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Funding Spike
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Rate Normal
          </span>
        )}
      </div>

      {/* Main Metric */}
      <div className="mt-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                isOverheated
                  ? "text-rose-400"
                  : isDiscount
                  ? "text-blue-400"
                  : "text-white"
              }`}
            >
              {formatPercent(fundingRate, 4)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {isPositive ? "Longs pay shorts" : "Shorts pay longs"}
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isOverheated
                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                : isDiscount
                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                : "bg-zinc-800/80 text-zinc-300 border-zinc-700"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>
              {isOverheated
                ? "Overheated Longs"
                : isDiscount
                ? "Crowded Shorts"
                : "Neutral Baseline"}
            </span>
          </div>
        </div>

        {/* Gauge / Spectrum Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>-0.05% (Extreme Short)</span>
            <span>0.00%</span>
            <span>+0.05% (Extreme Long)</span>
          </div>
          <div className="relative h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="absolute top-0 bottom-0 w-2 rounded-full bg-btc-gold transition-all duration-300 shadow-sm shadow-btc-gold"
              style={{ left: `calc(${progressPercent}% - 4px)` }}
            />
          </div>
        </div>

        {/* Details Footer */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {markPrice && (
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="text-xs text-zinc-400 mb-0.5">Futures Mark Price</div>
              <div className="text-sm font-semibold text-zinc-200">
                {formatCurrency(markPrice)}
              </div>
            </div>
          )}

          {fundingTime && (
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="flex items-center gap-1 text-xs text-zinc-400 mb-0.5">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>Reference Time</span>
              </div>
              <div className="text-xs font-semibold text-zinc-300">
                {typeof fundingTime === "number"
                  ? new Date(fundingTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : fundingTime}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
