"use client";

import React from "react";
import { Users, ChevronRight } from "lucide-react";
import { WhaleActivity, LargeTransactions, OnchainFlows } from "@/features/whale-intelligence";
import type { WhaleIntelligenceSummary } from "@/features/whale-intelligence";
import type { TabId } from "../../types/dashboard.types";

interface WhaleTabSectionProps {
  readonly whale: WhaleIntelligenceSummary | undefined;
  readonly activeTab: TabId;
  readonly onFocusTab: (tab: TabId) => void;
}

export function WhaleTabSection({
  whale,
  activeTab,
  onFocusTab,
}: WhaleTabSectionProps) {
  return (
    <section className="space-y-6">
      {activeTab === "all" && (
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Layer 3 • Whale &amp; On-Chain Intelligence
              </h2>
              <p className="text-xs text-zinc-500">
                Hyperliquid top 20 whale traders, net positioning, and mempool transfers &gt; 10 BTC
              </p>
            </div>
          </div>
          <button
            onClick={() => onFocusTab("whale")}
            className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            Focus Tab <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {whale && (
        <div className="space-y-6">
          {/* OnchainFlows Summary */}
          <OnchainFlows summary={whale} />

          {/* Whale Activity & Large Transactions Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <WhaleActivity
              topTraders={whale.topTraders ?? []}
              totalWhaleLongUsd={whale.totalWhaleLongUsd}
              totalWhaleShortUsd={whale.totalWhaleShortUsd}
              whaleBullRatio={whale.whaleBullRatio}
              freshness={whale.freshness}
            />
            <LargeTransactions
              transactions={whale.largeTransactions ?? []}
            />
          </div>
        </div>
      )}
    </section>
  );
}
