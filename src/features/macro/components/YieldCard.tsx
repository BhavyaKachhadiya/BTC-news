import React from "react";
import { Landmark, AlertTriangle, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import type { DataAvailability } from "../types/macro.types";

export interface YieldCardProps {
  treasury?: {
    twoYear?: number;
    tenYear?: number;
  };
  quote?: {
    twoYear?: number;
    tenYear?: number;
    timestamp?: string;
  };
  freshness?: DataAvailability;
}

export function YieldCard({ treasury, quote, freshness = "available" }: YieldCardProps) {
  const activeTreasury = treasury ?? quote;
  const tenYear = activeTreasury?.tenYear;
  const twoYear = activeTreasury?.twoYear;
  const hasData = tenYear !== undefined || twoYear !== undefined;

  const spread =
    tenYear !== undefined && twoYear !== undefined
      ? Number((tenYear - twoYear).toFixed(3))
      : undefined;

  const isInverted = spread !== undefined && spread < 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                US Treasury Yields
              </h3>
              <div className="text-[11px] text-zinc-500">10Y (^TNX) & 2Y Benchmark Proxy</div>
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
          {hasData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* 10Y Yield */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[11px] text-zinc-400 mb-1">10-Year Benchmark</div>
                  <div className="text-xl font-extrabold text-white">
                    {tenYear !== undefined ? `${tenYear.toFixed(2)}%` : "N/A"}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Risk-free hurdle rate</div>
                </div>

                {/* 2Y Yield */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[11px] text-zinc-400 mb-1">2-Year Treasury</div>
                  <div className="text-xl font-extrabold text-white">
                    {twoYear !== undefined ? `${twoYear.toFixed(2)}%` : "N/A"}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Fed policy expectations</div>
                </div>
              </div>

              {/* Yield Curve Spread */}
              {spread !== undefined && (
                <div
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                    isInverted
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isInverted ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Curve Spread (10Y - 2Y):</span>
                  </div>
                  <span className="font-bold font-mono">
                    {spread > 0 ? `+${spread.toFixed(2)}%` : `${spread.toFixed(2)}%`}
                    {isInverted ? " (Inverted)" : " (Normal)"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-zinc-500">
              Treasury telemetry currently unavailable
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
        <span>Higher rates = tighter liquidity</span>
        <span>Steepening = easing cycles</span>
      </div>
    </div>
  );
}
