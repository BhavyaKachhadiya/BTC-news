import React from "react";
import { Network, HardDrive, Zap, Layers, AlertTriangle, ShieldCheck } from "lucide-react";
import { formatNumber } from "@/shared/utils/formatters";
import type { NetworkData, NetworkAnomaly } from "../types/network.types";

interface NetworkCardProps {
  network: NetworkData;
  anomaly?: NetworkAnomaly;
}

export function NetworkCard({ network, anomaly }: NetworkCardProps) {
  const isAnomaly = anomaly?.isAnomaly ?? false;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">Mempool & Network</h2>
            <div className="text-xs text-zinc-500">Live mempool.space Telemetry</div>
          </div>
        </div>

        {isAnomaly ? (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Network Anomaly
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Mempool Normal
          </span>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {/* Block Height and Pending Txs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              Tip Block Height
            </div>
            <div className="text-base font-bold text-white">
              #{network.blockHeight.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
              Pending Transactions
            </div>
            <div className="text-base font-bold text-white">
              {formatNumber(network.txCount)}
            </div>
          </div>
        </div>

        {/* Recommended Fees */}
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
            <Zap className="w-3.5 h-3.5 text-btc-gold" />
            Recommended Priority Fees (sat/vB)
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-zinc-800/50">
              <div className="text-[10px] text-zinc-400">Fastest (Next Block)</div>
              <div className="text-sm font-bold text-btc-gold mt-0.5">{network.fastestFee} sat/vB</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-800/50">
              <div className="text-[10px] text-zinc-400">~30 Mins</div>
              <div className="text-sm font-semibold text-zinc-200 mt-0.5">{network.halfHourFee} sat/vB</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-800/50">
              <div className="text-[10px] text-zinc-400">~1 Hour</div>
              <div className="text-sm font-semibold text-zinc-200 mt-0.5">{network.hourFee} sat/vB</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
