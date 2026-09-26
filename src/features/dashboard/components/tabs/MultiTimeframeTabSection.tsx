"use client";

import React from "react";
import { Layers, ChevronRight } from "lucide-react";
import { TimeframeOverview, TimeframeSignal } from "@/features/multi-timeframe";
import type { MultiTimeframeAlignment } from "@/features/multi-timeframe";
import type { TabId } from "../../types/dashboard.types";

interface MultiTimeframeTabSectionProps {
  readonly effectiveMtf: MultiTimeframeAlignment | null;
  readonly activeTab: TabId;
  readonly onFocusTab: (tab: TabId) => void;
}

export function MultiTimeframeTabSection({
  effectiveMtf,
  activeTab,
  onFocusTab,
}: MultiTimeframeTabSectionProps) {
  return (
    <section className="space-y-6">
      {activeTab === "all" && (
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Layer 2 • Multi-Timeframe Alignment
              </h2>
              <p className="text-xs text-zinc-500">5-horizon trend confirmation from 5m scalping to 1d macro trend</p>
            </div>
          </div>
          <button
            onClick={() => onFocusTab("multi-timeframe")}
            className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            Focus Tab <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {effectiveMtf ? (
        <div className="space-y-6">
          <TimeframeSignal alignment={effectiveMtf} />
          <TimeframeOverview alignment={effectiveMtf} />
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-surface-800/60 p-12 text-center text-zinc-400 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />
          <div className="font-semibold text-white">Aggregating Multi-Timeframe Horizons...</div>
          <div className="text-xs text-zinc-500">Calculating EMAs and RSI across 5m, 15m, 1h, 4h, and 1D horizons</div>
        </div>
      )}
    </section>
  );
}
