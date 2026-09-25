import React from "react";
import { Calendar } from "lucide-react";

export function MacroTerminalView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
      <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3">
        <span className="text-xs text-zinc-400 font-mono">GLOBAL LIQUIDITY CORRELATION</span>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-zinc-400 text-[10px]">US DOLLAR (DXY)</div>
            <div className="text-base font-bold text-white mt-1">104.25</div>
            <div className="text-emerald-400 text-[11px]">-0.32% (Tailwind)</div>
          </div>
          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-zinc-400 text-[10px]">10Y US YIELD</div>
            <div className="text-base font-bold text-white mt-1">4.28%</div>
            <div className="text-zinc-400 text-[11px]">+0.01 bps (Flat)</div>
          </div>
          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-zinc-400 text-[10px]">S&P 500</div>
            <div className="text-base font-bold text-white mt-1">5,980.50</div>
            <div className="text-emerald-400 text-[11px]">+0.68% (Risk-On)</div>
          </div>
          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-zinc-400 text-[10px]">GOLD (GC=F)</div>
            <div className="text-base font-bold text-white mt-1">$2,740.20</div>
            <div className="text-emerald-400 text-[11px]">+0.45% (Safe Haven)</div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-btc-gold" /> UPCOMING FOMC & MACRO SCHEDULE
          </span>
          <span className="text-amber-400">Automated Feed</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-zinc-200">FOMC Interest Rate Decision</div>
              <div className="text-[10px] text-zinc-500">Federal Reserve Policy Announcement</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-[10px]">
              HIGH IMPACT
            </span>
          </div>
          <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-zinc-200">Consumer Price Index (CPI MoM/YoY)</div>
              <div className="text-[10px] text-zinc-500">Bureau of Labor Statistics</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-[10px]">
              HIGH IMPACT
            </span>
          </div>
          <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-zinc-200">Non-Farm Payrolls (NFP)</div>
              <div className="text-[10px] text-zinc-500">US Labor Employment Data</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px]">
              MED IMPACT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
