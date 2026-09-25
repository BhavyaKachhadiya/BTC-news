"use client";

import React from "react";
import { Activity, ChevronRight } from "lucide-react";
import { FundingRate, OpenInterest, LongShortRatio } from "@/features/derivatives";
import { MacroOverview, DxyCard, YieldCard, EconomicCalendarCard } from "@/features/macro";
import type { DerivativesSnapshot } from "@/features/derivatives";
import type { MacroSnapshot } from "@/features/macro";
import type { TabId } from "../../types/dashboard.types";

interface DerivativesMacroTabSectionProps {
  readonly derivatives: DerivativesSnapshot | undefined;
  readonly macro: MacroSnapshot | undefined;
  readonly activeTab: TabId;
  readonly onFocusTab: (tab: TabId) => void;
}

export function DerivativesMacroTabSection({
  derivatives,
  macro,
  activeTab,
  onFocusTab,
}: DerivativesMacroTabSectionProps) {
  return (
    <section className="space-y-8">
      {activeTab === "all" && (
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Layer 4 • Derivatives &amp; Macroeconomic Dynamics
              </h2>
              <p className="text-xs text-zinc-500">
                Perpetual funding spikes, open interest expansions, and cross-asset liquidity telemetry
              </p>
            </div>
          </div>
          <button
            onClick={() => onFocusTab("derivatives-macro")}
            className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            Focus Tab <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Derivatives Sub-Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Derivatives Market Structure
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            Binance &amp; Hyperliquid Perps
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FundingRate
            fundingRate={derivatives?.fundingRate ?? 0}
            isSpike={derivatives?.eventFlags?.isFundingSpike}
          />
          <OpenInterest
            openInterestBtc={derivatives?.openInterest}
          />
          <LongShortRatio
            ratio={derivatives?.longShortRatio ?? 1.0}
          />
        </div>
      </div>

      {/* Macro Sub-Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Macro &amp; Monetary Regime
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            DXY, US Treasury Yields &amp; S&amp;P 500
          </span>
        </div>

        {macro && (
          <MacroOverview snapshot={macro} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DxyCard
            quote={
              macro?.dxy
                ? {
                    value: macro.dxy.value,
                    changePercent: macro.dxy.changePercent,
                    timestamp: macro.timestamp,
                  }
                : undefined
            }
          />
          <YieldCard
            quote={
              macro?.treasury
                ? {
                    twoYear: macro.treasury.twoYear,
                    tenYear: macro.treasury.tenYear,
                    timestamp: macro.timestamp,
                  }
                : undefined
            }
          />
        </div>

        {/* Economic Calendar & Upcoming Major Catalysts */}
        <EconomicCalendarCard />
      </div>
    </section>
  );
}
