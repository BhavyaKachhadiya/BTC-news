import React from "react";
import { Activity, Gauge, TrendingUp, TrendingDown, Waves } from "lucide-react";
import { formatCurrency } from "@/shared/utils/formatters";
import type { TechnicalState } from "../types/technical.types";

interface TechnicalCardProps {
  technicals: TechnicalState;
}

export function TechnicalCard({ technicals }: TechnicalCardProps) {
  const isEmaBullish = technicals.ema20 > technicals.ema50;
  const isPriceAboveEma = technicals.currentPrice > technicals.ema20;

  // RSI interpretation
  let rsiLabel = "Neutral Momentum";
  let rsiColor = "text-amber-400";
  if (technicals.rsi14 >= 70) {
    rsiLabel = "Overbought Territory";
    rsiColor = "text-rose-400";
  } else if (technicals.rsi14 <= 30) {
    rsiLabel = "Oversold Territory";
    rsiColor = "text-emerald-400";
  } else if (technicals.rsi14 >= 50) {
    rsiLabel = "Bullish Expansion";
    rsiColor = "text-emerald-400";
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">Deterministic Indicators</h2>
            <div className="text-xs text-zinc-500">Pure Mathematical Computations</div>
          </div>
        </div>
        <div className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
          Pure Engine
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {/* RSI Meter */}
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Gauge className="w-3.5 h-3.5 text-zinc-500" />
              RSI (14) Momentum
            </div>
            <span className={`text-xs font-semibold ${rsiColor}`}>{rsiLabel}</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold text-white">{technicals.rsi14}</span>
            <span className="text-xs text-zinc-500">0 - 100</span>
          </div>
          {/* Visual bar */}
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${
                technicals.rsi14 > 70
                  ? "bg-rose-500"
                  : technicals.rsi14 < 30
                  ? "bg-emerald-500"
                  : "bg-indigo-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, technicals.rsi14))}%` }}
            />
          </div>
        </div>

        {/* Moving Average Stack */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
              <span>EMA (20)</span>
              {isPriceAboveEma ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <div className="text-sm font-semibold text-zinc-200">
              {formatCurrency(technicals.ema20)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Price {isPriceAboveEma ? "Above" : "Below"}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
              <span>EMA (50)</span>
              {isEmaBullish ? (
                <span className="text-[10px] text-emerald-400 font-medium">Golden Stack</span>
              ) : (
                <span className="text-[10px] text-rose-400 font-medium">Death Stack</span>
              )}
            </div>
            <div className="text-sm font-semibold text-zinc-200">
              {formatCurrency(technicals.ema50)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              EMA20 {isEmaBullish ? ">" : "<"} EMA50
            </div>
          </div>
        </div>

        {/* Volatility & ATR */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
              <Waves className="w-3 h-3 text-zinc-500" />
              ATR (14)
            </div>
            <div className="text-sm font-semibold text-zinc-200">
              {formatCurrency(technicals.atr14)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Volatility</div>
            <div className="text-sm font-semibold text-zinc-200">
              {technicals.volatility}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
