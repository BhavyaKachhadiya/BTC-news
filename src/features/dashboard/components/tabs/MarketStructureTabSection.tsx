"use client";

import React from "react";
import { Activity, ShieldCheck, Target, Droplet, ArrowDownToLine, ArrowUpToLine, ShieldAlert, Crosshair, ChevronRight } from "lucide-react";
import type { TabId } from "../../types/dashboard.types";

interface MarketStructureTabSectionProps {
  readonly marketStructure?: any; // any for now, matches what was in types.ts partially
  readonly activeTab: TabId;
  readonly onFocusTab: (tab: TabId) => void;
}

export function MarketStructureTabSection({
  marketStructure,
  activeTab,
  onFocusTab,
}: MarketStructureTabSectionProps) {
  if (!marketStructure) {
    return (
      <div className="p-8 text-center text-zinc-500 bg-surface-800 rounded-2xl border border-zinc-800">
        <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p>Market Structure data is currently unavailable.</p>
      </div>
    );
  }

  const isBullish = marketStructure.structure === 'bullish';
  const isBearish = marketStructure.structure === 'bearish';

  return (
    <section className="space-y-6">
      {activeTab === "all" && (
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Layer 3 • Market Structure &amp; Veteran Edge
              </h2>
              <p className="text-xs text-zinc-500">Support/Resistance, Order Blocks, Liquidity Sweeps, Risk/Reward</p>
            </div>
          </div>
          <button
            onClick={() => onFocusTab("market-structure")}
            className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            Focus Tab <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Structure Overview */}
        <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-zinc-400">
            <Target className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Macro Structure</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center">
             <div className={`text-2xl font-bold uppercase tracking-widest ${
               isBullish ? "text-emerald-400" : isBearish ? "text-rose-400" : "text-amber-400"
             }`}>
               {marketStructure.structure}
             </div>
             <p className="text-xs text-zinc-500 mt-2">
               Derived from Break of Structure (BoS) and Swing Highs/Lows across multi-timeframes.
             </p>
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-zinc-400">
            <ArrowDownToLine className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Key Levels (S/R)</h3>
          </div>
          <div className="space-y-3">
             <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Resistance</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {marketStructure.resistanceLevels?.length ? marketStructure.resistanceLevels.slice(0, 3).map((level: number, i: number) => (
                    <span key={i} className="px-2 py-1 bg-rose-500/10 text-rose-400 rounded-md text-xs font-mono border border-rose-500/20">
                      ${level.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  )) : <span className="text-xs text-zinc-600">None detected</span>}
                </div>
             </div>
             <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Support</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {marketStructure.supportLevels?.length ? marketStructure.supportLevels.slice(0, 3).map((level: number, i: number) => (
                    <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-xs font-mono border border-emerald-500/20">
                      ${level.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  )) : <span className="text-xs text-zinc-600">None detected</span>}
                </div>
             </div>
          </div>
        </div>

        {/* Liquidity Sweeps */}
        <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-zinc-400">
            <Droplet className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Liquidity Status</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Recent Sweeps</span>
              <span className="text-zinc-300 font-mono">{marketStructure.liquidity?.recentSweeps || "0"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Unmitigated Pools</span>
              <span className="text-zinc-300 font-mono">{marketStructure.liquidity?.unmitigatedPools || "0"}</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 border-t border-zinc-800/50 pt-2">
              Tracks areas where stop losses accumulate and potential institutional hunting grounds.
            </p>
          </div>
        </div>

        {/* Order Blocks */}
        <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-4 shadow-lg md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Order Blocks</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1"><ArrowUpToLine className="w-3 h-3 text-emerald-500"/> Demand</span>
                <div className="text-xl font-mono text-white mt-1">{marketStructure.demandBlocks?.length || 0}</div>
             </div>
             <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1"><ArrowDownToLine className="w-3 h-3 text-rose-500"/> Supply</span>
                <div className="text-xl font-mono text-white mt-1">{marketStructure.supplyBlocks?.length || 0}</div>
             </div>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-4 shadow-lg lg:col-span-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <Crosshair className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Risk/Reward & Psychology</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 text-center">
              <div className="text-[10px] text-zinc-500 uppercase">Suggested R/R</div>
              <div className="text-lg font-mono text-btc-gold mt-1">1 : {marketStructure.riskMetrics?.suggestedRR || "2.5"}</div>
            </div>
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 text-center">
              <div className="text-[10px] text-zinc-500 uppercase">Volatility Adj. Stop</div>
              <div className="text-lg font-mono text-zinc-200 mt-1">{marketStructure.riskMetrics?.volatilityStopPct || "1.2"}%</div>
            </div>
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 text-center flex flex-col items-center justify-center">
              <div className="text-[10px] text-zinc-500 uppercase mb-1">Market Psychology</div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {marketStructure.psychology?.sentiment || "Neutral Phase"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
