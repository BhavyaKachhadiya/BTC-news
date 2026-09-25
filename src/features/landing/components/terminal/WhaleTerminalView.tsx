import React from "react";
import { Activity, Coins, Zap } from "lucide-react";

export function WhaleTerminalView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
      <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Activity className="w-4 h-4 text-btc-gold" />
          <span>EXCHANGE RESERVE FLOWS</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-400">24h Inflows:</span>
            <span className="text-red-400 font-mono font-semibold">1,240 BTC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">24h Outflows:</span>
            <span className="text-emerald-400 font-mono font-semibold">2,890 BTC</span>
          </div>
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex justify-between">
            <span>Net Exchange Delta:</span>
            <span className="font-mono">-1,650 BTC (Outflow)</span>
          </div>
          <p className="text-[11px] text-zinc-500">Persistent net outflows indicate institutional spot accumulation off exchanges into cold storage.</p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Coins className="w-4 h-4 text-blue-400" />
          <span>HYPERLIQUID TOP-20 WHALES</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-400">Long / Short Exposure:</span>
            <span className="text-signal-long font-mono font-bold">68% Long / 32% Short</span>
          </div>
          <div className="w-full bg-red-500/40 h-2 rounded-full overflow-hidden flex">
            <div className="bg-signal-long h-full w-[68%]" />
          </div>
          <div className="flex justify-between text-zinc-400 pt-1">
            <span>Combined Whale PnL:</span>
            <span className="text-signal-long font-mono font-semibold">+$34,280,000</span>
          </div>
          <p className="text-[11px] text-zinc-500">Smart money positioning heavily skews net long on perpetual swaps with positive unearned carry.</p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>LARGE MEMPOOL TRANSFERS</span>
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex justify-between">
            <span className="text-zinc-400">Tx 8f19...c3b0</span>
            <span className="text-amber-400 font-bold">248.5 BTC ($15.9M)</span>
          </div>
          <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex justify-between">
            <span className="text-zinc-400">Tx 3a0c...91e2</span>
            <span className="text-amber-400 font-bold">115.0 BTC ($7.3M)</span>
          </div>
          <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex justify-between">
            <span className="text-zinc-400">Tx e742...10aa</span>
            <span className="text-amber-400 font-bold">84.2 BTC ($5.4M)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
