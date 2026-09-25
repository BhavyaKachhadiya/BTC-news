import React from "react";
import { Cpu, Sparkles, AlertCircle, CheckCircle2, ShieldAlert, Bot, Calculator } from "lucide-react";
import type { JevAnalysisResult } from "../types/jev.types";

interface JevCardProps {
  jev: JevAnalysisResult;
}

export function JevCard({ jev }: JevCardProps) {
  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case "bullish":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "bearish":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "ranging":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  const getNewsDirColor = (dir: string) => {
    switch (dir) {
      case "bullish":
        return "text-emerald-400";
      case "bearish":
        return "text-rose-400";
      default:
        return "text-zinc-400";
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl relative overflow-hidden">
      {/* Decorative gradient corner to emphasize AI layer */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full pointer-events-none" />

      <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">Jev Qualitative Interpretation</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                TypeSafe AI
              </span>
            </div>
            <div className="text-xs text-zinc-500">System One Qualitative Context Analyzer</div>
          </div>
        </div>

        {jev.isDegraded ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-btc-gold/15 text-btc-gold border border-btc-gold/30">
            <Calculator className="w-3.5 h-3.5 text-btc-gold" />
            Mode: Pure Deterministic
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            Mode: Jev AI Assisted (OpenRouter)
          </span>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {/* Mode Notice Banner */}
        {jev.isDegraded ? (
          <div className="p-3.5 rounded-xl bg-btc-gold/10 border border-btc-gold/30 text-xs text-zinc-300 flex items-start gap-3">
            <Calculator className="w-4 h-4 text-btc-gold mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase text-[10px] tracking-wider">
                  Pure Deterministic Mode Active
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Zero AI Dependency
                </span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Signals are calculated 100% deterministically from EMAs, RSI, Multi-Timeframe, Hyperbot Whales, and Derivatives without external AI dependency.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 text-xs text-purple-200 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-white">OpenRouter Decisions API (~typesafe/jev-latest):</span>{" "}
              {jev.summary}
            </div>
          </div>
        )}

        {/* Regime & Confidence */}
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 mb-1">Interpreted Market Regime</div>
            <span
              className={`inline-block text-sm font-bold uppercase px-3 py-1 rounded-lg border ${getRegimeColor(
                jev.marketRegime,
              )}`}
            >
              {jev.marketRegime}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-400 mb-1">Regime Confidence</div>
            <div className="text-base font-bold text-white">
              {(jev.regimeConfidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">News Bias</div>
            <div className={`text-sm font-semibold capitalize ${getNewsDirColor(jev.newsDirection)}`}>
              {jev.newsDirection}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">Setup Quality</div>
            <div className="text-sm font-semibold text-zinc-200">
              {jev.setupQualityScore} <span className="text-xs text-zinc-500">/ 10</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">Network Anomaly</div>
            <div className="text-sm font-semibold flex items-center gap-1">
              {jev.isNetworkAnomaly ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400">Yes</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">No</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
