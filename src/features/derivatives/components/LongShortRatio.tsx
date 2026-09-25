import React from "react";
import { Users, AlertTriangle, ShieldCheck } from "lucide-react";
import { formatPercent } from "@/shared/utils/formatters";

export interface LongShortRatioProps {
  readonly longShortRatio?: number; // Ratio, e.g. 1.25
  readonly ratio?: number; // Alias for longShortRatio
  readonly longAccount?: number; // Long account fraction (0.55 = 55%) or percentage (55)
  readonly shortAccount?: number; // Short account fraction (0.45 = 45%) or percentage (45)
  readonly isImbalanced?: boolean;
  readonly provider?: string;
  readonly className?: string;
}

export function LongShortRatio({
  longShortRatio,
  ratio,
  longAccount,
  shortAccount,
  isImbalanced = false,
  provider = "binance",
  className = "",
}: LongShortRatioProps) {
  const currentRatio = ratio ?? longShortRatio ?? 1.0;

  // Normalize longAccount and shortAccount to percentages (0..100)
  let longPct: number;
  let shortPct: number;

  if (longAccount !== undefined && shortAccount !== undefined) {
    longPct = longAccount <= 1 ? longAccount * 100 : longAccount;
    shortPct = shortAccount <= 1 ? shortAccount * 100 : shortAccount;
  } else {
    // Derive from ratio: ratio = long / short; long + short = 1
    // short = 1 / (ratio + 1); long = ratio / (ratio + 1)
    const total = currentRatio + 1;
    longPct = (currentRatio / total) * 100;
    shortPct = (1 / total) * 100;
  }

  const isExtremeLong = currentRatio > 1.8;
  const isExtremeShort = currentRatio < 0.6;

  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
              Global Long / Short Ratio
            </h2>
            <div className="text-xs text-zinc-500">Binance Account Positioning (1h)</div>
          </div>
        </div>

        {isImbalanced || isExtremeLong || isExtremeShort ? (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            {isExtremeLong ? "Extreme Long Bias" : "Extreme Short Bias"}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Positions Balanced
          </span>
        )}
      </div>

      {/* Main Metric */}
      <div className="mt-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {currentRatio.toFixed(2)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Ratio of accounts with net-long vs net-short exposure
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-emerald-400">
              {longPct.toFixed(1)}% Longs
            </div>
            <div className="text-xs font-semibold text-rose-400 mt-0.5">
              {shortPct.toFixed(1)}% Shorts
            </div>
          </div>
        </div>

        {/* Visual Dual-Tone Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500/80 transition-all duration-300"
              style={{ width: `${longPct}%` }}
              title={`Long Accounts: ${longPct.toFixed(1)}%`}
            />
            <div
              className="h-full bg-rose-500/80 transition-all duration-300"
              style={{ width: `${shortPct}%` }}
              title={`Short Accounts: ${shortPct.toFixed(1)}%`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>0.6 (Short Overcrowding)</span>
            <span>1.0 (Equal Parity)</span>
            <span>1.8 (Long Overcrowding)</span>
          </div>
        </div>

        {/* Risk / Contrarian Insight */}
        {(isExtremeLong || isExtremeShort) && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <span className="font-semibold">Contrarian Warning:</span>{" "}
            {isExtremeLong
              ? "Over 64% of retail accounts are net-long. Excessive one-sided bullish positioning historically elevates long-cascade liquidation risk."
              : "Excessive short positioning detected. Heavy short crowding historically primes sharp short-squeeze rebounds."}
          </div>
        )}
      </div>
    </div>
  );
}
