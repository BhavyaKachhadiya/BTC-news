"use client";

import React from "react";
import { RotateCw } from "lucide-react";

export function DashboardLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-900 text-zinc-300">
      <div className="p-4 rounded-2xl bg-surface-800/80 border border-zinc-800 flex flex-col items-center max-w-md w-full text-center space-y-4 shadow-2xl">
        <RotateCw className="w-10 h-10 animate-spin text-btc-gold" />
        <div>
          <div className="text-base font-bold text-white tracking-tight">
            Connecting to BTC Intelligence Engine...
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Synchronizing CoinGecko, Mempool, Binance, Hyperliquid, Yahoo Finance &amp; News feeds
          </div>
        </div>
        <div className="w-full space-y-2 pt-2">
          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-btc-gold animate-pulse w-3/4 rounded-full" />
          </div>
          <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Initializing deterministic synthesis pipelines
          </div>
        </div>
      </div>
    </div>
  );
}
