import React from "react";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Database } from "lucide-react";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";
import type { MarketData } from "../types/market.types";

interface MarketCardProps {
  market: MarketData;
}

export function MarketCard({ market }: MarketCardProps) {
  const isPositive = market.change24h >= 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-btc-gold/10 text-btc-gold border border-btc-gold/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">Bitcoin Market</h2>
            <div className="text-xs text-zinc-500">Live CoinGecko Ingestion</div>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
          isPositive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
        }`}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {formatPercent(market.change24h)}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {formatCurrency(market.price)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">BTC / USD Spot Reference</div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
              24h Volume
            </div>
            <div className="text-sm font-semibold text-zinc-200">
              {formatCurrency(market.volume24h, 0)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <Database className="w-3.5 h-3.5 text-zinc-500" />
              Market Cap
            </div>
            <div className="text-sm font-semibold text-zinc-200">
              {formatCurrency(market.marketCap, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
