import React from "react";
import { Zap, ShieldCheck, CheckCircle, Clock } from "lucide-react";
import { formatTimestamp } from "@/shared/utils/formatters";
import type { SignalResult } from "../types/signal.types";

interface SignalCardProps {
  signal: SignalResult;
}

export function SignalCard({ signal }: SignalCardProps) {
  const getActionStyles = (action: string) => {
    switch (action) {
      case "LONG":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          badge: "bg-emerald-500 text-black",
          bar: "bg-emerald-500",
          glow: "shadow-emerald-500/20",
        };
      case "SHORT":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
          badge: "bg-rose-500 text-white",
          bar: "bg-rose-500",
          glow: "shadow-rose-500/20",
        };
      default:
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          badge: "bg-amber-500 text-black",
          bar: "bg-amber-500",
          glow: "shadow-amber-500/20",
        };
    }
  };

  const styles = getActionStyles(signal.action);

  return (
    <div className={`rounded-2xl border ${styles.bg} p-6 backdrop-blur-sm shadow-xl ${styles.glow}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-btc-gold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
              Deterministic Research Signal
            </h2>
            <div className="text-xs text-zinc-500">TypeScript Signal Synthesis Engine</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-btc-gold" />
            Paper Mode Only
          </span>
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimestamp(signal.timestamp)}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Signal Banner */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-2">
            Recommended Action
          </div>
          <div className={`px-8 py-3 rounded-xl font-black text-3xl sm:text-4xl tracking-wider shadow-lg ${styles.badge}`}>
            {signal.action}
          </div>
          <div className="text-xs text-zinc-500 mt-3 text-center">
            {signal.action === "WAIT"
              ? "Stand aside: Insufficient or conflicting conviction"
              : `Simulated ${signal.action} entry authorized`}
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Engine Confidence
            </span>
            <span className="text-2xl font-black text-white">{signal.confidence}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-700 ${styles.bar}`}
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Confidence is deterministically computed from technical indicator harmony, macro regime alignment, and network stability.
          </p>
        </div>

        {/* Deterministic Reasons */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-3">
            Decision Reasons
          </div>
          <ul className="space-y-2">
            {signal.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                <CheckCircle className="w-3.5 h-3.5 text-btc-gold mt-0.5 flex-shrink-0" />
                <span className="leading-snug">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
