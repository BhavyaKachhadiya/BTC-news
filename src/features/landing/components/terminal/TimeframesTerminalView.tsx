import React from "react";
import { ShieldCheck } from "lucide-react";

export function TimeframesTerminalView() {
  const timeframes = [
    { tf: "5m", bias: "Bullish", rsi: 58.2, ema: "Above", conf: "82%" },
    { tf: "15m", bias: "Bullish", rsi: 61.4, ema: "Above", conf: "88%" },
    { tf: "1h", bias: "Neutral", rsi: 51.1, ema: "Ranging", conf: "64%" },
    { tf: "4h", bias: "Bullish", rsi: 56.8, ema: "Above", conf: "90%" },
    { tf: "1D", bias: "Strong Bull", rsi: 64.0, ema: "Above", conf: "94%" },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>TIME-SCALE INDEPENDENCE WITH HIGHER-TIMEFRAME VETO</span>
        <span className="text-signal-long font-semibold">Alignment Score: 85% Confluence</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {timeframes.map((item) => (
          <div key={item.tf} className="p-4 rounded-xl border border-zinc-800 bg-surface-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-btc-gold">{item.tf}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">{item.conf}</span>
            </div>
            <div className="text-base font-bold text-signal-long">{item.bias}</div>
            <div className="text-[11px] text-zinc-400 space-y-0.5 font-mono">
              <div>RSI: {item.rsi}</div>
              <div>EMA20: {item.ema}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-btc-gold flex-shrink-0" />
        <span>Rule: Scalp signals on 5m and 15m are filtered out if the 4h and 1D macro indicators point in the opposite direction.</span>
      </div>
    </div>
  );
}
