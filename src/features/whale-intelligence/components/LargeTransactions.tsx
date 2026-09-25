import React from "react";
import {
  Zap,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers,
} from "lucide-react";
import { formatCurrency, formatTimestamp } from "@/shared/utils/formatters";
import type { WhaleTransaction } from "../types/whale.types";
import { LARGE_BTC_TRANSACTION_THRESHOLD } from "../services/transaction.service";

export interface LargeTransactionsProps {
  transactions: readonly WhaleTransaction[];
  thresholdBtc?: number;
}

export function LargeTransactions({
  transactions,
  thresholdBtc = LARGE_BTC_TRANSACTION_THRESHOLD,
}: LargeTransactionsProps) {
  const truncateHash = (hash: string) => {
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const getClassificationBadgeClass = (classification: string) => {
    switch (classification) {
      case "Mega Whale Transfer":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "Whale Transfer":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
                Mempool Large Transactions
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                &gt; {thresholdBtc} BTC
              </span>
            </div>
            <p className="text-xs text-zinc-500">Live unconfirmed Bitcoin on-chain whale transfers</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800/80 text-zinc-300 border border-zinc-700">
            <Layers className="w-3.5 h-3.5 text-btc-gold" />
            {transactions.length} Transfers Detected
          </span>
        </div>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
          No transfers exceeding {thresholdBtc} BTC detected in the recent mempool window.
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.transactionId}
              className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getClassificationBadgeClass(
                      tx.classification,
                    )}`}
                  >
                    {tx.classification}
                  </span>

                  <a
                    href={`https://mempool.space/tx/${tx.transactionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-xs text-zinc-400 hover:text-white transition-colors group"
                  >
                    <span>{truncateHash(tx.transactionId)}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-white" />
                  </a>
                </div>

                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock className="w-3 h-3 text-zinc-600" />
                  <span>{formatTimestamp(tx.timestamp)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-zinc-800/50">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold font-mono text-white">
                    {tx.amountBtc.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}{" "}
                    <span className="text-btc-gold text-xs">BTC</span>
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    ≈ {formatCurrency(tx.amountUsd, 0)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400">
                    {tx.source}
                  </span>
                  <ArrowRight className="w-3 h-3 text-zinc-600" />
                  <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400">
                    {tx.destination}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
