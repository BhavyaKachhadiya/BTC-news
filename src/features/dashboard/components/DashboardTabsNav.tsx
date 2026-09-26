"use client";

import React from "react";
import type { TabId, TabItem } from "../types/dashboard.types";

interface DashboardTabsNavProps {
  readonly tabs: readonly TabItem[];
  readonly activeTab: TabId;
  readonly onSelectTab: (tab: TabId) => void;
  readonly onHoverTab?: (tab: TabId) => void;
}

export function DashboardTabsNav({ tabs, activeTab, onSelectTab, onHoverTab }: DashboardTabsNavProps) {
  return (
    <nav className="sticky top-[57px] z-40 bg-surface-900/95 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                onMouseEnter={() => onHoverTab?.(tab.id)}
                onFocus={() => onHoverTab?.(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-btc-gold text-black shadow-md shadow-btc-gold/20"
                    : "bg-surface-800 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-zinc-400"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      isActive
                        ? "bg-black/20 text-black border border-black/20"
                        : tab.badgeColor ?? "bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-2 text-xs text-zinc-500 whitespace-nowrap">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Terminal Active</span>
        </div>
      </div>
    </nav>
  );
}
