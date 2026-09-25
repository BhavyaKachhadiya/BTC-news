"use client";

import React, { useState } from "react";
import { History, Filter, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency, formatTimestamp, formatPercent } from "@/shared/utils/formatters";
import type { HistoricalSignalRecord } from "../types/history.types";
import type { SignalAction } from "@/features/signal";

interface HistoryTableProps {
  history: readonly HistoricalSignalRecord[];
}

export function HistoryTable({ history }: HistoryTableProps) {
  const [filterAction, setFilterAction] = useState<string>("ALL");

  const filtered = history.filter((item) => {
    if (filterAction === "ALL") return true;
    return item.action === filterAction;
  });

  const getActionBadge = (action: SignalAction) => {
    switch (action) {
      case "LONG":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "SHORT":
        return "bg-rose-500/20 text-rose-400 border border-rose-500/30";
      default:
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
              Decision & Outcome History
            </h2>
            <div className="text-xs text-zinc-500">Immutable Audit Trail Persisted to MongoDB</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          <Filter className="w-3.5 h-3.5 text-zinc-500 ml-2" />
          {(["ALL", "LONG", "SHORT", "WAIT"] as const).map((action) => (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterAction === action
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            No historical decisions found matching filter criteria.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 text-zinc-400 font-medium">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Signal</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3">BTC Price</th>
                <th className="py-3 px-3">RSI / EMAs</th>
                <th className="py-3 px-3">Jev Regime</th>
                <th className="py-3 px-3">Outcome (1h / 4h / 24h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                    {formatTimestamp(item.timestamp)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getActionBadge(item.action)}`}>
                      {item.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-zinc-200 whitespace-nowrap">
                    {item.confidence}%
                  </td>
                  <td className="py-3 px-3 font-medium text-zinc-100 whitespace-nowrap">
                    {formatCurrency(item.btcPrice)}
                  </td>
                  <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                    <span>RSI {item.rsi14}</span> • <span className="text-zinc-500">EMA20 ${Math.round(item.ema20).toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-3 text-zinc-300 capitalize whitespace-nowrap">
                    {item.marketRegime} ({item.newsDirection})
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {item.outcome ? (
                      <div className="flex items-center gap-2 text-[11px]">
                        <span title="1-Hour Outcome">
                          1h: {item.outcome.pnlPercent1h != null ? (
                            <span className={item.outcome.pnlPercent1h >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                              {formatPercent(item.outcome.pnlPercent1h)}
                            </span>
                          ) : (
                            <span className="text-zinc-500">Pending</span>
                          )}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span title="4-Hour Outcome">
                          4h: {item.outcome.pnlPercent4h != null ? (
                            <span className={item.outcome.pnlPercent4h >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                              {formatPercent(item.outcome.pnlPercent4h)}
                            </span>
                          ) : (
                            <span className="text-zinc-500">Pending</span>
                          )}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span title="24-Hour Outcome">
                          24h: {item.outcome.pnlPercent24h != null ? (
                            <span className={item.outcome.pnlPercent24h >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                              {formatPercent(item.outcome.pnlPercent24h)}
                            </span>
                          ) : (
                            <span className="text-zinc-500">Pending</span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-[11px]">Evaluating</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
