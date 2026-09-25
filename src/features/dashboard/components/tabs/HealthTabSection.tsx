"use client";

import React from "react";
import { Server, ChevronRight } from "lucide-react";
import { HealthStatusWidget } from "@/features/monitoring";
import type { TabId } from "../../types/dashboard.types";

interface HealthTabSectionProps {
  readonly activeTab: TabId;
  readonly onFocusTab: (tab: TabId) => void;
}

export function HealthTabSection({ activeTab, onFocusTab }: HealthTabSectionProps) {
  return (
    <section className="space-y-6">
      {activeTab === "all" && (
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                System Health, Latency &amp; Data Freshness
              </h2>
              <p className="text-xs text-zinc-500">Live operational monitoring of all 6 external data feeds and database connection</p>
            </div>
          </div>
          <button
            onClick={() => onFocusTab("health")}
            className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            Focus Tab <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <HealthStatusWidget />
    </section>
  );
}
