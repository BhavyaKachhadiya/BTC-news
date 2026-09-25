import React from "react";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Layers,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  BarChart2,
} from "lucide-react";
import { formatCurrency, formatPercent, formatTimestamp } from "@/shared/utils/formatters";
import { DxyCard } from "./DxyCard";
import { YieldCard } from "./YieldCard";
import type { MacroSnapshot } from "../types/macro.types";

export interface MacroOverviewProps {
  readonly snapshot: MacroSnapshot;
}

export function MacroOverview({ snapshot }: MacroOverviewProps) {
  const { dxy, treasury, equities, gold, freshness, timestamp } = snapshot;

  // Determine overall macro regime
  const dxyChange = dxy?.changePercent ?? 0;
  const sp500 = equities?.sp500;
  const isDxyWeakening = dxyChange < -0.05;
  const isDxySurging = dxyChange > 0.15;

  let regimeTitle = "Neutral Macro Regime";
  let regimeDesc = "Macro liquidity is balanced. Cross-asset signals show steady baseline conditions.";
  let regimeColor = "border-zinc-700 bg-zinc-900/60 text-zinc-300";
  let regimePillColor = "bg-zinc-800 text-zinc-300";

  if (isDxyWeakening) {
    regimeTitle = "Liquidity Expansion (Risk-On)";
    regimeDesc = "Weakening dollar and stable debt yields offer structural monetary tailwinds for Bitcoin.";
    regimeColor = "border-emerald-500/30 bg-emerald-950/20 text-emerald-300";
    regimePillColor = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  } else if (isDxySurging) {
    regimeTitle = "Dollar Tightening (Risk-Off)";
    regimeDesc = "Dollar strength and tightening conditions impose macro resistance on zero-yielding assets.";
    regimeColor = "border-rose-500/30 bg-rose-950/20 text-rose-300";
    regimePillColor = "bg-rose-500/20 text-rose-400 border border-rose-500/30";
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-btc-gold/10 text-btc-gold border border-btc-gold/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Macro Intelligence & Cross-Asset Telemetry
              </h2>
              <p className="text-xs text-zinc-400">
                Live foreign exchange, sovereign yields, equities, and monetary reserves
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Freshness Badge */}
            {freshness === "available" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Telemetry Available
              </span>
            )}
            {freshness === "stale" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-3.5 h-3.5" />
                Telemetry Stale / Cached
              </span>
            )}
            {freshness === "unavailable" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                Telemetry Unavailable
              </span>
            )}

            <div className="text-[11px] text-zinc-500 font-mono hidden md:block">
              {formatTimestamp(timestamp)}
            </div>
          </div>
        </div>

        {/* Macro Regime Banner */}
        <div className={`mt-5 p-4 rounded-xl border ${regimeColor} flex items-start gap-3`}>
          <div className="p-1.5 rounded-lg bg-zinc-900/60 mt-0.5">
            <Sparkles className="w-4 h-4 text-btc-gold" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Macro Regime Analysis:
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${regimePillColor}`}>
                {regimeTitle}
              </span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">{regimeDesc}</p>
          </div>
        </div>
      </div>

      {/* Grid of Macro Asset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DXY Card */}
        <DxyCard dxy={dxy} freshness={freshness} />

        {/* Treasury Yields Card */}
        <YieldCard treasury={treasury} freshness={freshness} />

        {/* Equities (S&P 500 & NASDAQ) Card */}
        <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    US Equity Benchmarks
                  </h3>
                  <div className="text-[11px] text-zinc-500">S&P 500 (^GSPC) & Tech Liquidity</div>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                Risk-Asset Proxy
              </span>
            </div>

            <div className="mt-4">
              {equities?.sp500 !== undefined ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="text-[11px] text-zinc-400 mb-1">S&P 500 Index</div>
                      <div className="text-xl font-extrabold text-white">
                        {formatCurrency(equities.sp500, 2)}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Broad institutional equity</div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="text-[11px] text-zinc-400 mb-1">NASDAQ Tech Proxy</div>
                      <div className="text-xl font-extrabold text-white">
                        {equities.nasdaq !== undefined
                          ? formatCurrency(equities.nasdaq, 2)
                          : "Tracked"}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">High-beta correlation</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-700/50 text-xs text-zinc-300 flex items-center justify-between">
                    <span className="text-zinc-400">Equity Regime:</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> High Risk Appetite
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-zinc-500">
                  Equity benchmark telemetry currently unavailable
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Correlation with BTC: High (0.60-0.75)</span>
            <span>Risk-on barometer</span>
          </div>
        </div>

        {/* Gold & Hard Asset Reserves Card */}
        <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    Gold Spot Reserves (GC=F)
                  </h3>
                  <div className="text-[11px] text-zinc-500">Monetary Hard Asset / Inflation Hedge</div>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400/90">
                Digital vs Physical
              </span>
            </div>

            <div className="mt-4">
              {gold ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-white tracking-tight">
                        {formatCurrency(gold.price, 2)}
                      </span>
                      <span className="text-xs text-zinc-500 ml-1.5 font-mono">/ troy oz</span>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                        gold.changePercent >= 0
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-rose-400 bg-rose-500/10"
                      }`}
                    >
                      {gold.changePercent >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {formatPercent(gold.changePercent)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-700/50 text-xs text-zinc-300">
                    <span className="text-zinc-400 block text-[10px] uppercase tracking-wider mb-0.5">
                      Store-of-Value Narrative:
                    </span>
                    Gold strength indicates flight to hard monetary reserves, historically validating BTC digital gold thesis.
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-zinc-500">
                  Gold telemetry currently unavailable
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Market Cap: ~$18T</span>
            <span>BTC Cap Ratio: ~10%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
