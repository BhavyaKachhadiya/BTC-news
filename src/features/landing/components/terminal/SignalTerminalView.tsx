import React from "react";

export function SignalTerminalView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <div className="p-5 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>ENGINE RECOMMENDATION</span>
          <span className="text-signal-long font-semibold">99.8% CERTAINTY</span>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-extrabold text-signal-long tracking-tight">STRONG BUY</div>
          <div className="text-xs text-zinc-400">Target Range: $65,800 - $66,400</div>
        </div>
        <div className="pt-2 border-t border-zinc-800/80 space-y-2 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Signal Confidence:</span>
            <span className="text-white font-mono font-bold">88 / 100</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-signal-long h-full w-[88%]" />
          </div>
          <div className="flex justify-between text-zinc-400 pt-1">
            <span>Market Regime:</span>
            <span className="text-amber-400 font-semibold">Bullish Trend Continuation</span>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3">
        <span className="text-xs text-zinc-400 font-mono">DETERMINISTIC CONFLUENCE</span>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between p-2 rounded bg-zinc-900/80 border border-zinc-800">
            <span className="text-zinc-400">RSI (14-period):</span>
            <span className="text-zinc-200 font-bold">54.6 (Neutral-Bull)</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-zinc-900/80 border border-zinc-800">
            <span className="text-zinc-400">EMA Cross (20/50):</span>
            <span className="text-signal-long font-bold">Golden Cross Active</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-zinc-900/80 border border-zinc-800">
            <span className="text-zinc-400">ATR Volatility:</span>
            <span className="text-zinc-200 font-bold">$1,240 (Expansion)</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-zinc-900/80 border border-zinc-800">
            <span className="text-zinc-400">Mempool Fees:</span>
            <span className="text-blue-400 font-bold">14 sat/vB (Low Congestion)</span>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-4">
        <span className="text-xs text-zinc-400 font-mono">EXECUTION PLAN (PAPER TRADING)</span>
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Simulated Entry:</span>
            <span className="text-white font-mono font-semibold">$64,320.00</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Stop Loss (ATR 1.5x):</span>
            <span className="text-signal-short font-mono font-semibold">$62,460.00 (-2.8%)</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Take Profit (Tier 1):</span>
            <span className="text-signal-long font-mono font-semibold">$66,800.00 (+3.8%)</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Take Profit (Tier 2):</span>
            <span className="text-signal-long font-mono font-semibold">$68,200.00 (+6.0%)</span>
          </div>
          <div className="pt-2 border-t border-zinc-800 flex justify-between text-zinc-400">
            <span>Risk / Reward Ratio:</span>
            <span className="text-amber-400 font-bold">1 : 2.14</span>
          </div>
        </div>
      </div>
    </div>
  );
}
