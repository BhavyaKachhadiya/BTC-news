import React from "react";
import {
  Users,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Shield,
  Activity,
  Award,
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";
import type { HyperliquidWhaleTrader } from "../types/whale.types";

export interface WhaleActivityProps {
  topTraders: readonly HyperliquidWhaleTrader[];
  totalWhaleLongUsd?: number;
  totalWhaleShortUsd?: number;
  whaleBullRatio?: number;
  freshness?: string;
}

export function WhaleActivity({
  topTraders,
  totalWhaleLongUsd,
  totalWhaleShortUsd,
  whaleBullRatio,
  freshness,
}: WhaleActivityProps) {
  // Format short address e.g. 0x1234...5678
  const truncateAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const bullPercent = typeof whaleBullRatio === "number" ? whaleBullRatio * 100 : 50;
  const bearPercent = 100 - bullPercent;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
                Hyperliquid Whale Positioning
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Top 20 PnL
              </span>
            </div>
            <p className="text-xs text-zinc-500">Live smart money positioning & leverage</p>
          </div>
        </div>

        {freshness && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Updated: {freshness}</span>
          </div>
        )}
      </div>

      {/* Aggregate Long vs Short Ratio Bar */}
      {typeof totalWhaleLongUsd === "number" && typeof totalWhaleShortUsd === "number" && (
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Whale Longs: {formatCurrency(totalWhaleLongUsd, 0)}</span>
              <span className="text-zinc-500">({bullPercent.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400 font-medium">
              <span>({bearPercent.toFixed(1)}%)</span>
              <span>Whale Shorts: {formatCurrency(totalWhaleShortUsd, 0)}</span>
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Visual Ratio Progress Bar */}
          <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${bullPercent}%` }}
              title={`Whale Long: ${bullPercent.toFixed(1)}%`}
            />
            <div
              className="bg-rose-500 transition-all duration-500"
              style={{ width: `${bearPercent}%` }}
              title={`Whale Short: ${bearPercent.toFixed(1)}%`}
            />
          </div>
        </div>
      )}

      {/* Top Whales Leaderboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-btc-gold" />
            Top Whale Traders
          </h3>
          <span className="text-xs text-zinc-500">
            {topTraders.length} Active Whales Monitored
          </span>
        </div>

        {topTraders.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No whale positions detected for this interval.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 text-zinc-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Trader Address</th>
                  <th className="py-2.5 px-3 text-right">7D PnL</th>
                  <th className="py-2.5 px-3 text-right">Win Rate</th>
                  <th className="py-2.5 px-3 text-right">Avg Lev</th>
                  <th className="py-2.5 px-3 text-right">Position Exposure</th>
                  <th className="py-2.5 px-3 text-right">Total Equity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {topTraders.map((trader, idx) => {
                  const isLongBias = trader.snapLongPositionValue >= trader.snapShortPositionValue;
                  const isProfitable = trader.totalPnl >= 0;

                  return (
                    <tr
                      key={trader.address}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-zinc-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3">
                        <a
                          href={`https://app.hyperliquid.xyz/explorer/address/${trader.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 font-mono text-zinc-200 hover:text-purple-400 transition-colors group"
                        >
                          <span>{truncateAddress(trader.address)}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-purple-400" />
                        </a>
                      </td>

                      <td className="py-3 px-3 text-right font-medium">
                        <span
                          className={
                            isProfitable
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {formatCurrency(trader.totalPnl, 0)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-zinc-300">
                        {formatPercent(trader.winRate * 100, 1)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300">
                          {trader.avgLeverage.toFixed(1)}x
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={
                              isLongBias
                                ? "text-emerald-400 font-semibold"
                                : "text-rose-400 font-semibold"
                            }
                          >
                            {isLongBias
                              ? `L: ${formatCurrency(trader.snapLongPositionValue, 0)}`
                              : `S: ${formatCurrency(trader.snapShortPositionValue, 0)}`}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {trader.snapLongPositionCount}L / {trader.snapShortPositionCount}S
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-zinc-300">
                        {formatCurrency(trader.snapTotalValue, 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
