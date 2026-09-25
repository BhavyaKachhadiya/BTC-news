import React from "react";
import { ShieldCheck, Wallet, ArrowUpRight, ArrowDownRight, Briefcase, Award } from "lucide-react";
import { formatCurrency, formatPercent, formatTimestamp } from "@/shared/utils/formatters";
import type { PortfolioSummary } from "../types/paper-trading.types";

interface PaperTradingCardProps {
  portfolio: PortfolioSummary;
  btcPrice: number;
}

export function PaperTradingCard({ portfolio, btcPrice }: PaperTradingCardProps) {
  const isPnlPositive = portfolio.totalRealizedPnl >= 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl">
      {/* Compulsory Paper Trading Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-btc-gold border border-btc-gold/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
              Paper Trading Engine
            </h2>
            <div className="text-xs text-zinc-500">Virtual Portfolio Simulation ($10,000 Starting)</div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wider uppercase">
          <ShieldCheck className="w-4 h-4" />
          PAPER MODE • NO REAL ORDERS
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {/* Equity & PnL Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">Portfolio Equity</div>
            <div className="text-base font-bold text-white">{formatCurrency(portfolio.equity)}</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">Cash Balance</div>
            <div className="text-base font-semibold text-zinc-200">{formatCurrency(portfolio.cashBalance)}</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">Realized PnL</div>
            <div className={`text-base font-bold ${isPnlPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {isPnlPositive ? "+" : ""}{formatCurrency(portfolio.totalRealizedPnl)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-btc-gold" />
              Win Rate
            </div>
            <div className="text-base font-bold text-white">
              {portfolio.winRate}% <span className="text-xs font-normal text-zinc-500">({portfolio.winningTrades}/{portfolio.closedPositions.length})</span>
            </div>
          </div>
        </div>

        {/* Active Open Positions */}
        <div>
          <div className="text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-2 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
            Active Simulated Positions ({portfolio.openPositions.length})
          </div>

          {portfolio.openPositions.length === 0 ? (
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-850 text-center text-xs text-zinc-500">
              No open simulated positions. Awaiting high-conviction LONG or SHORT signals.
            </div>
          ) : (
            <div className="space-y-2">
              {portfolio.openPositions.map((pos) => {
                const sideMult = pos.side === "LONG" ? 1 : -1;
                const uPnl = (btcPrice - pos.entryPrice) * pos.amountBtc * sideMult;
                const uPnlPercent = (uPnl / pos.allocatedUsd) * 100;
                const isProfitable = uPnl >= 0;

                return (
                  <div
                    key={pos.id}
                    className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                          pos.side === "LONG"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {pos.side}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">
                          {pos.amountBtc} BTC @ {formatCurrency(pos.entryPrice)}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Opened {formatTimestamp(pos.openedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xs font-bold flex items-center gap-1 justify-end ${
                        isProfitable ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {isProfitable ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isProfitable ? "+" : ""}{formatCurrency(uPnl)} ({formatPercent(uPnlPercent)})
                      </div>
                      <div className="text-[10px] text-zinc-500">Unrealized PnL</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
