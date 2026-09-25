import React from "react";
import { DollarSign, TrendingDown, TrendingUp, Minus, ShieldCheck, AlertCircle, Clock } from "lucide-react";
import { formatPercent } from "@/shared/utils/formatters";
import type { DataAvailability } from "../types/macro.types";

export interface DxyCardProps {
  dxy?: {
    value: number;
    changePercent: number;
  };
  quote?: {
    value: number;
    changePercent: number;
    timestamp?: string;
  };
  freshness?: DataAvailability;
}

export function DxyCard({ dxy, quote, freshness = "available" }: DxyCardProps) {
  const activeDxy = dxy ?? quote;
  const isAvailable = Boolean(activeDxy);
  const change = activeDxy?.changePercent ?? 0;
  const isWeakening = change < 0;
  const isSurging = change > 0;

  // For BTC, falling DXY is typically bullish liquidity tailwind; rising DXY is headwind
  let btcImpact = "Neutral Dollar Momentum";
  let impactColor = "text-zinc-400";
  let bgImpact = "bg-zinc-800/40 border-zinc-700/50";

  if (isWeakening) {
    btcImpact = "Bullish Tailwind (Liquidity Expansion)";
    impactColor = "text-emerald-400";
    bgImpact = "bg-emerald-500/10 border-emerald-500/20";
  } else if (isSurging) {
    btcImpact = "Macro Headwind (Tightening / Dollar Flight)";
    impactColor = "text-rose-400";
    bgImpact = "bg-rose-500/10 border-rose-500/20";
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                US Dollar Index (DXY)
              </h3>
              <div className="text-[11px] text-zinc-500">ICE Futures / Public Quotes</div>
            </div>
          </div>

          {/* Freshness Badge */}
          {freshness === "available" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" /> Live
            </span>
          )}
          {freshness === "stale" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-3 h-3" /> Cached
            </span>
          )}
          {freshness === "unavailable" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              <AlertCircle className="w-3 h-3" /> Offline
            </span>
          )}
        </div>

        {/* Content */}
        <div className="mt-4">
          {isAvailable ? (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {activeDxy!.value.toFixed(2)}
                  </span>
                  <span className="text-xs text-zinc-500 ml-1.5 font-mono">pts</span>
                </div>
                <div
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                    isWeakening
                      ? "text-emerald-400 bg-emerald-500/10"
                      : isSurging
                      ? "text-rose-400 bg-rose-500/10"
                      : "text-zinc-300 bg-zinc-800"
                  }`}
                >
                  {isWeakening ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : isSurging ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                  {formatPercent(change)}
                </div>
              </div>

              {/* BTC Implication Banner */}
              <div className={`p-2.5 rounded-xl border ${bgImpact} text-xs font-medium ${impactColor}`}>
                <div className="text-[10px] uppercase tracking-wider opacity-75 mb-0.5 text-zinc-400">
                  Bitcoin Correlation Implication:
                </div>
                {btcImpact}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-zinc-500">
              DXY quote telemetry currently unavailable
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
        <span>Benchmark: Basket vs 6 FX</span>
        <span>Neutral: ~100-105</span>
      </div>
    </div>
  );
}
