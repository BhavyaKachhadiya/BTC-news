import React from "react";
import { Cpu } from "lucide-react";

export function JevTerminalView() {
  return (
    <div className="p-5 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3 font-mono text-xs animate-fade-in">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-amber-400 flex items-center gap-1.5 font-bold">
          <Cpu className="w-4 h-4 text-btc-gold" />
          TYPESAFE JEV AI REASONING AUDIT (GEMINI 2.5 FLASH)
        </span>
        <span className="text-zinc-500">Execution Time: 342ms</span>
      </div>
      <div className="p-3 rounded bg-zinc-950 border border-zinc-800/80 space-y-2 text-zinc-300 leading-relaxed font-sans text-xs">
        <p>
          <strong className="text-white">Synthesized Thesis:</strong> Bitcoin is breaking out of a 4-hour ascending compression zone with strong volume confirmation. 
          Derivatives funding rates remain calm at +0.008%, indicating organic spot accumulation rather than over-leveraged retail chase.
        </p>
        <p>
          <strong className="text-white">Risk Counter-Argument:</strong> DXY consolidation around 104.25 could create temporary dollar strength headwinds if macro yields tick up ahead of upcoming FOMC dates.
        </p>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded bg-signal-long/10 text-signal-long border border-signal-long/20">Bias: BULLISH_EXPANSION</span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Regime: LOW_VOL_ACCUMULATION</span>
          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">Fallback Guard: VERIFIED</span>
        </div>
      </div>
    </div>
  );
}
