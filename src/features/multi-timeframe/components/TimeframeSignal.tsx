"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Layers,
  HelpCircle,
} from "lucide-react";
import type {
  MultiTimeframeAlignment,
  AlignmentStatus,
  TimeframeTrend,
  Timeframe,
} from "../types/timeframe.types";

interface TimeframeSignalProps {
  alignment: MultiTimeframeAlignment;
  compact?: boolean;
}

export function TimeframeSignal({ alignment, compact = false }: TimeframeSignalProps) {
  const { overallTrend, alignedCount, alignmentStatus, timeframes } = alignment;

  const getStatusBadgeStyle = (status: AlignmentStatus) => {
    switch (status) {
      case "aligned bullish":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "aligned bearish":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "transitioning":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "mixed":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "uncertain":
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getTrendIcon = (trend: TimeframeTrend) => {
    switch (trend) {
      case "bullish":
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      case "bearish":
        return <TrendingDown className="w-3.5 h-3.5 text-rose-400" />;
      case "ranging":
        return <RefreshCw className="w-3.5 h-3.5 text-amber-400" />;
      case "uncertain":
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getTrendBadgeColor = (trend: TimeframeTrend) => {
    switch (trend) {
      case "bullish":
        return "bg-emerald-950/40 text-emerald-400 border-emerald-800/40";
      case "bearish":
        return "bg-rose-950/40 text-rose-400 border-rose-800/40";
      case "ranging":
        return "bg-amber-950/40 text-amber-400 border-amber-800/40";
      case "uncertain":
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${getStatusBadgeStyle(
            alignmentStatus,
          )}`}
        >
          {alignmentStatus}
        </span>
        <span className="text-xs text-zinc-400 font-mono">
          ({alignedCount}/5)
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Timeframe Alignment
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 capitalize">
              {getTrendIcon(overallTrend)}
              <span>{overallTrend} Bias</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-zinc-400">Aligned Horizons</div>
            <div className="text-sm font-mono font-bold text-zinc-200">
              {alignedCount} / {timeframes.length || 5}
            </div>
          </div>
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border shadow-sm ${getStatusBadgeStyle(
              alignmentStatus,
            )}`}
          >
            {alignmentStatus}
          </span>
        </div>
      </div>

      {/* Horizon Pills */}
      {timeframes.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
          {timeframes.map((tf) => (
            <div
              key={tf.timeframe}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getTrendBadgeColor(
                tf.trend,
              )}`}
            >
              <span className="font-mono text-zinc-300 font-semibold">{tf.timeframe}:</span>
              <span className="capitalize">{tf.trend}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
