"use client";

import React from "react";
import { Activity, ShieldCheck, Target, Droplet, ArrowDownToLine, ArrowUpToLine, ShieldAlert, Crosshair, ChevronRight, Layers, TrendingUp, TrendingDown, BarChart2, Compass, Zap } from "lucide-react";
import type { TabId } from "../../types/dashboard.types";
import { TradingViewChart } from "@/features/chart";

interface MarketStructureTabSectionProps {
  readonly marketStructure?: any;
  readonly activeTab: TabId;
  readonly onFocusTab: (tab: TabId) => void;
  readonly timeframe?: string;
  readonly onSelectTimeframe?: (tf: string) => void;
}

export function MarketStructureTabSection({
  marketStructure,
  activeTab,
  onFocusTab,
  timeframe = "15m",
  onSelectTimeframe,
}: MarketStructureTabSectionProps) {
  const [internalTimeframe, setInternalTimeframe] = React.useState<string>(timeframe);
  const currentTimeframe = timeframe || internalTimeframe;

  const handleSelectTimeframe = (tf: string) => {
    setInternalTimeframe(tf);
    onSelectTimeframe?.(tf);
  };

  if (!marketStructure) {
    return (
      <div className="p-8 text-center text-zinc-500 bg-surface-800 rounded-2xl border border-zinc-800">
        <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p>Market Structure data is currently unavailable.</p>
      </div>
    );
  }

  const isBullish = marketStructure.structure === 'bullish';
  const isBearish = marketStructure.structure === 'bearish';

  return (
    <section className="space-y-6">
      {/* Timeframe Bar & Focus Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Layer 3 • Market Structure &amp; Veteran Edge
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-btc-gold border border-amber-500/20 uppercase">
                {currentTimeframe} Active
              </span>
            </div>
            <p className="text-xs text-zinc-500">Support/Resistance, Order Blocks, Liquidity Sweeps, Risk/Reward</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Scalper / Swing Timeframe Selector */}
          <div className="flex items-center p-0.5 bg-zinc-900/90 rounded-xl border border-zinc-800">
            {[
              { id: "15m", label: "15M (Scalp)" },
              { id: "1h", label: "1H" },
              { id: "4h", label: "4H (Swing)" },
              { id: "1D", label: "1D" },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => handleSelectTimeframe(tf.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  currentTimeframe === tf.id
                    ? "bg-btc-gold/20 text-btc-gold border border-btc-gold/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {activeTab === "all" && (
            <button
              onClick={() => onFocusTab("market-structure")}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer pl-1"
            >
              Focus Tab <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 0. INTERACTIVE TRADINGVIEW & ENGINE CANDLESTICK CHART */}
      <TradingViewChart
        marketStructure={marketStructure}
        timeframe={currentTimeframe}
        onSelectTimeframe={handleSelectTimeframe}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Structure Overview */}
        <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-zinc-400">
            <Target className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Macro Structure</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center">
             <div className={`text-2xl font-bold uppercase tracking-widest ${
               isBullish ? "text-emerald-400" : isBearish ? "text-rose-400" : "text-amber-400"
             }`}>
               {marketStructure.structure}
             </div>
             <p className="text-xs text-zinc-500 mt-2">
               Derived from Break of Structure (BoS) and Swing Highs/Lows across multi-timeframes.
             </p>
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-zinc-400">
            <ArrowDownToLine className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Key Levels (S/R)</h3>
          </div>
          <div className="space-y-3">
             <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Resistance</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {marketStructure.resistanceLevels?.length ? marketStructure.resistanceLevels.slice(0, 3).map((level: number, i: number) => (
                    <span key={i} className="px-2 py-1 bg-rose-500/10 text-rose-400 rounded-md text-xs font-mono border border-rose-500/20">
                      ${level.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  )) : <span className="text-xs text-zinc-600">None detected</span>}
                </div>
             </div>
             <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Support</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {marketStructure.supportLevels?.length ? marketStructure.supportLevels.slice(0, 3).map((level: number, i: number) => (
                    <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-xs font-mono border border-emerald-500/20">
                      ${level.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  )) : <span className="text-xs text-zinc-600">None detected</span>}
                </div>
             </div>
          </div>
        </div>

        {/* Liquidity Sweeps */}
        <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-3.5 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Liquidity Sweeps</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-btc-gold border border-amber-500/20 uppercase font-bold">
                {marketStructure.liquidity?.timeframe || currentTimeframe}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {marketStructure.liquidity?.sweeps?.length || marketStructure.liquidity?.recentSweeps || 0} hunts
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1.5">
                Swept Levels (Where Hunts Occurred)
              </span>
              {marketStructure.liquidity?.sweeps && marketStructure.liquidity.sweeps.length > 0 ? (
                <div className="space-y-1.5">
                  {marketStructure.liquidity.sweeps.slice(0, 3).map((sweep: any, idx: number) => {
                    const isLow = sweep.type === "low_sweep";
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLow ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]"
                            }`}
                          />
                          <span className={isLow ? "text-emerald-400/90 font-medium" : "text-rose-400/90 font-medium"}>
                            {isLow ? "Swept Low" : "Swept High"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {sweep.sweptExtreme && (
                            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                              wick: ${Number(sweep.sweptExtreme).toLocaleString()}
                            </span>
                          )}
                          <span className="font-mono font-bold text-white text-xs">
                            ${Number(sweep.level).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : marketStructure.liquidity?.sweptLevels?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {marketStructure.liquidity.sweptLevels.map((lvl: number, i: number) => (
                    <span key={i} className="px-2 py-1 bg-cyan-500/10 text-cyan-300 rounded-md text-xs font-mono border border-cyan-500/20">
                      ${lvl.toLocaleString()}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-zinc-500 italic">No recent sweep levels detected</span>
              )}
            </div>

            {/* Resting Liquidity Pools (Target locations) */}
            {(marketStructure.liquidity?.buySide?.length > 0 || marketStructure.liquidity?.sellSide?.length > 0) && (
              <div className="pt-2 border-t border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
                  Active Pools (Resting Stops)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {marketStructure.liquidity?.buySide?.slice(0, 2).map((lvl: number, i: number) => (
                    <span key={`buy-${i}`} className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-mono">
                      Buy: ${lvl.toLocaleString()}
                    </span>
                  ))}
                  {marketStructure.liquidity?.sellSide?.slice(0, 2).map((lvl: number, i: number) => (
                    <span key={`sell-${i}`} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono">
                      Sell: ${lvl.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-zinc-500 pt-1">
              Exact price levels where stop losses were triggered and instantly reclaimed/rejected.
            </p>
          </div>
        </div>

        {/* Order Blocks */}
        <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-4 shadow-lg md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Order Blocks</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1"><ArrowUpToLine className="w-3 h-3 text-emerald-500"/> Demand</span>
                <div className="text-xl font-mono text-white mt-1">{marketStructure.demandBlocks?.length || 0}</div>
             </div>
             <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1"><ArrowDownToLine className="w-3 h-3 text-rose-500"/> Supply</span>
                <div className="text-xl font-mono text-white mt-1">{marketStructure.supplyBlocks?.length || 0}</div>
             </div>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-4 shadow-lg lg:col-span-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <Crosshair className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Risk/Reward & Psychology</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 text-center">
              <div className="text-[10px] text-zinc-500 uppercase">Suggested R/R</div>
              <div className="text-lg font-mono text-btc-gold mt-1">1 : {marketStructure.riskMetrics?.suggestedRR || "2.5"}</div>
            </div>
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 text-center">
              <div className="text-[10px] text-zinc-500 uppercase">Volatility Adj. Stop</div>
              <div className="text-lg font-mono text-zinc-200 mt-1">{marketStructure.riskMetrics?.volatilityStopPct || "1.2"}%</div>
            </div>
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 text-center flex flex-col items-center justify-center">
              <div className="text-[10px] text-zinc-500 uppercase mb-1">Market Psychology</div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {marketStructure.psychology?.sentiment || "Neutral Phase"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FULL INDICATOR CONFLUENCE & VETERAN EDGE MATRIX */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-btc-gold" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Indicator Confluence Matrix (Technical Suite + Veteran Edge)
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            14 Indicators &bull; {currentTimeframe} Dynamic Confluence
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Elliott Wave Analyzer */}
          <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Elliott Wave Cycle</h4>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                marketStructure.indicators?.elliottWave?.direction === "bullish"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {marketStructure.indicators?.elliottWave?.phase || "Cycle"}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-xl font-bold font-mono text-white">
                Wave {marketStructure.indicators?.elliottWave?.currentWave || "3"}
              </div>
              <div className="text-xs font-mono text-zinc-400">
                Target: <span className="text-btc-gold font-bold">${marketStructure.indicators?.elliottWave?.targetPrice?.toLocaleString() || "—"}</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              {marketStructure.indicators?.elliottWave?.description || "Wave progression tracking institutional impulse & corrective rotations."}
            </p>
          </div>

          {/* Supertrend & MACD */}
          <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Supertrend &amp; MACD</h4>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                marketStructure.indicators?.supertrend?.direction === "bullish"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {marketStructure.indicators?.supertrend?.direction || "Bullish"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase block">Supertrend Stop</span>
                <span className="font-mono font-bold text-white text-xs">
                  ${marketStructure.indicators?.supertrend?.stop ? Number(marketStructure.indicators.supertrend.stop).toLocaleString() : "—"}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase block">MACD Histogram</span>
                <span className={`font-mono font-bold text-xs ${
                  (marketStructure.indicators?.macd?.histogram ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {marketStructure.indicators?.macd?.histogram != null ? (marketStructure.indicators.macd.histogram > 0 ? `+${marketStructure.indicators.macd.histogram.toFixed(1)}` : marketStructure.indicators.macd.histogram.toFixed(1)) : "—"}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-400 border-t border-zinc-800/60 pt-1.5">
              <span>MA Crossover:</span>
              <span className="font-semibold text-zinc-300">{marketStructure.indicators?.crossovers?.summary || "Moving Averages Aligned"}</span>
            </div>
          </div>

          {/* Bollinger Bands & VWAP */}
          <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Bollinger Bands &amp; VWAP</h4>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                VWAP
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">VWAP Benchmark</span>
              <span className="font-mono font-bold text-cyan-300">
                ${marketStructure.indicators?.vwap ? Number(marketStructure.indicators.vwap).toLocaleString() : "—"}
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-500">Upper Band (+2σ)</span>
                <span className="font-mono text-zinc-300">${marketStructure.indicators?.bollinger?.upper ? Math.round(marketStructure.indicators.bollinger.upper).toLocaleString() : "—"}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-500">Lower Band (-2σ)</span>
                <span className="font-mono text-zinc-300">${marketStructure.indicators?.bollinger?.lower ? Math.round(marketStructure.indicators.bollinger.lower).toLocaleString() : "—"}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-1.5">
              <span>Bandwidth: {marketStructure.indicators?.bollinger?.bandwidth ? `${(marketStructure.indicators.bollinger.bandwidth * 100).toFixed(1)}%` : "Normal"}</span>
              <span>%B: {marketStructure.indicators?.bollinger?.percentB ? marketStructure.indicators.bollinger.percentB.toFixed(2) : "0.50"}</span>
            </div>
          </div>

          {/* Ichimoku Cloud & Stochastic */}
          <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Ichimoku &amp; Stochastic</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {marketStructure.indicators?.ichimoku?.sentiment || "Cloud Neutral"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase block">Tenkan / Kijun</span>
                <span className="font-mono text-zinc-300 text-xs font-semibold">
                  ${marketStructure.indicators?.ichimoku?.tenkan ? Math.round(marketStructure.indicators.ichimoku.tenkan).toLocaleString() : "—"} / ${marketStructure.indicators?.ichimoku?.kijun ? Math.round(marketStructure.indicators.ichimoku.kijun).toLocaleString() : "—"}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase block">Stochastic %K / %D</span>
                <span className="font-mono text-zinc-300 text-xs font-semibold">
                  {marketStructure.indicators?.stochastic?.k != null ? `${marketStructure.indicators.stochastic.k} / ${marketStructure.indicators.stochastic.d}` : "50 / 50"}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-400 border-t border-zinc-800/60 pt-1.5">
              <span>Stochastic Signal:</span>
              <span className="font-semibold text-zinc-300">{marketStructure.indicators?.stochastic?.signal || "Neutral Momentum"}</span>
            </div>
          </div>

          {/* ADX Trend Strength & Volatility */}
          <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">ADX Trend Strength</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {marketStructure.indicators?.adx?.trendStrength || "Active Trend"}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">
                {marketStructure.indicators?.adx?.adx != null ? marketStructure.indicators.adx.adx.toFixed(1) : "24.5"}
              </span>
              <span className="text-xs text-zinc-500">
                +DI: <span className="text-emerald-400 font-mono font-semibold">{marketStructure.indicators?.adx?.plusDI != null ? marketStructure.indicators.adx.plusDI.toFixed(1) : "—"}</span> | -DI: <span className="text-rose-400 font-mono font-semibold">{marketStructure.indicators?.adx?.minusDI != null ? marketStructure.indicators.adx.minusDI.toFixed(1) : "—"}</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-1.5">
              <span>RSI (14): <strong className="text-zinc-300">{marketStructure.indicators?.rsi != null ? marketStructure.indicators.rsi.toFixed(1) : "50"}</strong></span>
              <span>Volatility: <strong className="text-zinc-300">{marketStructure.riskMetrics?.volatilityStopPct || "1.2"}%</strong></span>
            </div>
          </div>

          {/* Volume Profile & Fibonacci Golden Pockets */}
          <div className="p-5 rounded-2xl bg-surface-800 border border-zinc-800 flex flex-col space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-btc-gold" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Volume Profile &amp; Fib Pockets</h4>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-btc-gold border border-amber-500/20">
                POC
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Point of Control (POC)</span>
              <span className="font-mono font-bold text-btc-gold">
                ${marketStructure.volumeProfile?.poc ? Number(marketStructure.volumeProfile.poc).toLocaleString() : "—"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between text-[11px] p-1.5 rounded bg-zinc-900/50 border border-zinc-800/60">
                <span className="text-zinc-500">VAH</span>
                <span className="font-mono text-zinc-300">${marketStructure.volumeProfile?.vah ? Math.round(marketStructure.volumeProfile.vah).toLocaleString() : "—"}</span>
              </div>
              <div className="flex justify-between text-[11px] p-1.5 rounded bg-zinc-900/50 border border-zinc-800/60">
                <span className="text-zinc-500">VAL</span>
                <span className="font-mono text-zinc-300">${marketStructure.volumeProfile?.val ? Math.round(marketStructure.volumeProfile.val).toLocaleString() : "—"}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-1.5">
              <span>Fib 0.618 Pocket: <strong className="text-btc-gold">${marketStructure.indicators?.fibonacci?.p618 ? Math.round(marketStructure.indicators.fibonacci.p618).toLocaleString() : "—"}</strong></span>
              <span>0.5: <strong className="text-zinc-300">${marketStructure.indicators?.fibonacci?.p500 ? Math.round(marketStructure.indicators.fibonacci.p500).toLocaleString() : "—"}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
