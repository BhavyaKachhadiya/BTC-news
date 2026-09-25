"use client";

import React from "react";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  HelpCircle,
  Layers,
  Gauge,
  Activity,
} from "lucide-react";
import { formatCurrency } from "@/shared/utils/formatters";
import type {
  MultiTimeframeAlignment,
  TimeframeAnalysis,
  TimeframeTrend,
  AlignmentStatus,
} from "../types/timeframe.types";
import { TimeframeSignal } from "./TimeframeSignal";

interface TimeframeOverviewProps {
  alignment?: MultiTimeframeAlignment | null;
  isLoading?: boolean;
}

export function TimeframeOverview({
  alignment,
  isLoading = false,
}: TimeframeOverviewProps) {
  const getTrendBadge = (trend: TimeframeTrend) => {
    switch (trend) {
      case "bullish":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <TrendingUp className="w-3.5 h-3.5" />
            Bullish
          </span>
        );
      case "bearish":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/25">
            <TrendingDown className="w-3.5 h-3.5" />
            Bearish
          </span>
        );
      case "ranging":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
            <RefreshCw className="w-3.5 h-3.5" />
            Ranging
          </span>
        );
      case "uncertain":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            <HelpCircle className="w-3.5 h-3.5" />
            Uncertain
          </span>
        );
    }
  };

  const getRsiColor = (rsi: number) => {
    if (rsi >= 70) return "text-rose-400 font-bold";
    if (rsi <= 30) return "text-emerald-400 font-bold";
    if (rsi >= 50) return "text-emerald-300";
    return "text-zinc-300";
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
              Multi-Timeframe Analysis
            </h2>
            <div className="text-xs text-zinc-500">
              Independent Technical Computation Across 5 Horizons
            </div>
          </div>
        </div>

        {alignment && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
              Overall:
            </span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                alignment.alignmentStatus === "aligned bullish"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : alignment.alignmentStatus === "aligned bearish"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  : alignment.alignmentStatus === "transitioning"
                  ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                  : alignment.alignmentStatus === "mixed"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}
            >
              {alignment.alignmentStatus} ({alignment.alignedCount}/5)
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-zinc-500 gap-3">
          <Activity className="w-6 h-6 animate-spin text-btc-gold" />
          <span className="text-xs">Fetching klines across 5 timeframes from Binance...</span>
        </div>
      ) : !alignment || alignment.timeframes.length === 0 ? (
        <div className="py-12 text-center text-xs text-zinc-500">
          No timeframe data available. Run the analysis pipeline to inspect horizons.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                  <th className="py-3 px-3">Horizon</th>
                  <th className="py-3 px-3">Trend</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">RSI (14)</th>
                  <th className="py-3 px-3">EMA (20)</th>
                  <th className="py-3 px-3">EMA (50)</th>
                  <th className="py-3 px-3">ATR (14)</th>
                  <th className="py-3 px-3">Volatility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {alignment.timeframes.map((item: TimeframeAnalysis) => {
                  const isEmaBullish = item.ema20 > item.ema50;
                  const isPriceAboveEma20 = item.price > item.ema20;

                  return (
                    <tr
                      key={item.timeframe}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-zinc-100 whitespace-nowrap">
                        <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
                          {item.timeframe}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getTrendBadge(item.trend)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-100 whitespace-nowrap">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono ${getRsiColor(item.rsi)}`}>
                            {item.rsi}
                          </span>
                          <div className="w-12 h-1.5 rounded-full bg-zinc-800 overflow-hidden hidden sm:block">
                            <div
                              className={`h-full ${
                                item.rsi >= 70
                                  ? "bg-rose-500"
                                  : item.rsi <= 30
                                  ? "bg-emerald-500"
                                  : "bg-indigo-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, item.rsi))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-300 font-mono whitespace-nowrap">
                        <span className={isPriceAboveEma20 ? "text-emerald-400/90" : "text-zinc-400"}>
                          {formatCurrency(item.ema20)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-300 font-mono whitespace-nowrap">
                        <span className={isEmaBullish ? "text-emerald-400/90" : "text-rose-400/90"}>
                          {formatCurrency(item.ema50)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-300 font-mono whitespace-nowrap">
                        {formatCurrency(item.atr)}
                      </td>
                      <td className="py-3 px-3 font-mono whitespace-nowrap">
                        <span
                          className={
                            item.volatility > 5.0
                              ? "text-rose-400 font-bold"
                              : "text-zinc-300"
                          }
                        >
                          {item.volatility}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Micro summary card */}
          <div className="pt-2">
            <TimeframeSignal alignment={alignment} />
          </div>
        </div>
      )}
    </div>
  );
}
