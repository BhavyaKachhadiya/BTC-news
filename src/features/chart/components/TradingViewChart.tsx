"use client";

import React, { useEffect, useState, useId, useMemo } from "react";
import {
  TrendingUp,
  Compass,
  Layers,
  Copy,
  Check,
  ExternalLink,
  Target,
  BarChart2,
  Info,
} from "lucide-react";
import type { MarketStructureState } from "@/features/market-structure/types";

interface TradingViewChartProps {
  readonly marketStructure?: MarketStructureState;
  readonly timeframe?: string;
  readonly onSelectTimeframe?: (tf: string) => void;
}

// User-specified Fibonacci Dealing Range & Negative Extension levels
const FIB_SPECIFIED_LEVELS = [
  { level: 1.0, label: "Range High (1.0)", type: "high", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { level: 0.5, label: "Equilibrium (0.5)", type: "eq", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { level: 0.0, label: "Range Low (0.0)", type: "low", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { level: -0.5, label: "Target 1 (-0.5)", type: "ext", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { level: -1.0, label: "Target 2 (-1.0)", type: "ext", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { level: -1.5, label: "Target 3 (-1.5)", type: "ext", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { level: -2.0, label: "Target 4 (-2.0)", type: "ext", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { level: -3.0, label: "Macro Target (-3.0)", type: "ext", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
] as const;

export function TradingViewChart({
  marketStructure,
  timeframe = "15m",
  onSelectTimeframe,
}: TradingViewChartProps) {
  const [copiedFib, setCopiedFib] = useState(false);
  const tvContainerId = useId().replace(/:/g, "_") + "_tv_widget";

  // Compute swing high, swing low, and user-specified Fibonacci levels
  const fibCalculations = useMemo(() => {
    const bars = marketStructure?.bars || [];
    let high = 0;
    let low = 0;

    if (bars.length > 0) {
      high = Math.max(...bars.map((b) => b.high));
      low = Math.min(...bars.map((b) => b.low));
    } else {
      high = Math.max(...(marketStructure?.resistanceLevels || [90000]));
      low = Math.min(...(marketStructure?.supportLevels || [84000]));
    }

    const range = high - low;
    const currentPrice =
      bars.length > 0
        ? bars[bars.length - 1].close
        : marketStructure?.supportLevels?.[0] || (high + low) / 2;

    const levels = FIB_SPECIFIED_LEVELS.map((item) => {
      // Dealing range calculation: Low + (level * range)
      // Level 1.0 = High, Level 0.5 = Midpoint, Level 0.0 = Low
      // Negative levels: Low - (|level| * range)
      const price = low + item.level * range;
      const diffFromCurrent = ((price - currentPrice) / currentPrice) * 100;
      return {
        ...item,
        price,
        diffFromCurrent,
      };
    });

    // Traditional Pivot Points calculation
    // P = (High + Low + Close) / 3
    // R1 = 2P - Low, S1 = 2P - High
    // R2 = P + (High - Low), S2 = P - (High - Low)
    // R3 = High + 2(P - Low), S3 = Low - 2(High - P)
    const pivot = (high + low + currentPrice) / 3;
    const r1 = 2 * pivot - low;
    const s1 = 2 * pivot - high;
    const r2 = pivot + range;
    const s2 = pivot - range;
    const r3 = high + 2 * (pivot - low);
    const s3 = low - 2 * (high - pivot);

    return {
      high,
      low,
      range,
      currentPrice,
      levels,
      pivots: {
        pivot,
        r1,
        r2,
        r3,
        s1,
        s2,
        s3,
      },
      vwap: marketStructure?.indicators?.vwap || currentPrice,
    };
  }, [marketStructure]);

  // Embed Native TradingView Advanced Real-Time Chart Widget
  useEffect(() => {
    const tvContainer = document.getElementById(tvContainerId);
    if (!tvContainer) return;

    tvContainer.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    const tvInterval =
      timeframe === "1D"
        ? "D"
        : timeframe === "4h"
        ? "240"
        : timeframe === "1h"
        ? "60"
        : "15";

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "BINANCE:BTCUSDT",
      interval: tvInterval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_top_toolbar: false,
      hide_side_toolbar: false, // Keep drawing tools active (Fibonacci Retracement on left toolbar)
      save_image: true,
      studies: [
        "VWAP@tv-basicstudies",
        "PivotPointsStandard@tv-basicstudies",
      ],
      studies_overrides: {
        "Pivot Points Standard.Type": "Traditional",
      },
    });

    tvContainer.appendChild(script);

    return () => {
      if (tvContainer) {
        tvContainer.innerHTML = "";
      }
    };
  }, [timeframe, tvContainerId]);

  const handleCopyFibLevels = () => {
    const fibString = "0, -1, 0.5, -3, 1, -1.5, -2, -0.5";
    navigator.clipboard.writeText(fibString);
    setCopiedFib(true);
    setTimeout(() => setCopiedFib(false), 2500);
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-800 overflow-hidden shadow-2xl flex flex-col space-y-0">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-zinc-800/80 gap-3 bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-btc-gold border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                TradingView &bull; BTC/USDT
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                  BINANCE
                </span>
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  VWAP
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Pivots Traditional
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  Fib (0, -1, 0.5, -3, 1, -1.5, -2, -0.5)
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live WebSocket Stream &bull; Traditional Pivots &bull; Volume-Weighted Average Price &bull; Fib Drawing Toolbar
            </p>
          </div>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-0.5 bg-zinc-950 rounded-xl border border-zinc-800">
            {[
              { id: "15m", label: "15M (Scalp)" },
              { id: "1h", label: "1H" },
              { id: "4h", label: "4H" },
              { id: "1D", label: "1D" },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => onSelectTimeframe?.(tf.id)}
                className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframe === tf.id
                    ? "bg-btc-gold/20 text-btc-gold border border-btc-gold/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <a
            href="https://www.tradingview.com/chart/?symbol=BINANCE:BTCUSDT"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Open in TradingView Web"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 2. FIBONACCI TARGETS HUD (Levels 0, -1, 0.5, -3, 1, -1.5, -2, -0.5) */}
      <div className="px-4 py-3 bg-zinc-900/40 border-b border-zinc-800/80">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Fibonacci Retracement &amp; Expansion Target Matrix
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              [Range: ${fibCalculations.low.toLocaleString()} - ${fibCalculations.high.toLocaleString()}]
            </span>
          </div>

          <button
            onClick={handleCopyFibLevels}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all cursor-pointer"
            title="Copy exact levels for TradingView Fib Retracement tool"
          >
            {copiedFib ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Levels Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Fib Levels (0, -1, 0.5, -3, 1, -1.5, -2, -0.5)</span>
              </>
            )}
          </button>
        </div>

        {/* Level Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {fibCalculations.levels.map((item) => (
            <div
              key={item.level}
              className={`p-2 rounded-xl border flex flex-col justify-between ${item.color}`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-semibold">
                <span>{item.level.toFixed(1)}</span>
                <span
                  className={
                    item.diffFromCurrent >= 0
                      ? "text-emerald-400/80"
                      : "text-rose-400/80"
                  }
                >
                  {item.diffFromCurrent >= 0 ? "+" : ""}
                  {item.diffFromCurrent.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs font-bold font-mono mt-1 text-white tracking-tight">
                ${Math.round(item.price).toLocaleString()}
              </div>
              <div className="text-[9px] text-zinc-400 truncate mt-0.5">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. TRADITIONAL PIVOTS & VWAP BAR */}
      <div className="flex items-center gap-4 px-4 py-2 bg-zinc-950/60 border-b border-zinc-800 text-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px] shrink-0">
          <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>VWAP:</span>
          <span className="font-bold text-cyan-400">
            ${Math.round(fibCalculations.vwap).toLocaleString()}
          </span>
        </div>

        <div className="h-3 w-px bg-zinc-800 shrink-0" />

        <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px] shrink-0">
          <span className="text-zinc-500 font-sans font-medium uppercase text-[10px] tracking-wider">
            Traditional Pivots:
          </span>
          <span className="text-rose-400">
            R3: ${Math.round(fibCalculations.pivots.r3).toLocaleString()}
          </span>
          <span className="text-rose-300">
            R2: ${Math.round(fibCalculations.pivots.r2).toLocaleString()}
          </span>
          <span className="text-rose-200">
            R1: ${Math.round(fibCalculations.pivots.r1).toLocaleString()}
          </span>
          <span className="text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            P: ${Math.round(fibCalculations.pivots.pivot).toLocaleString()}
          </span>
          <span className="text-emerald-200">
            S1: ${Math.round(fibCalculations.pivots.s1).toLocaleString()}
          </span>
          <span className="text-emerald-300">
            S2: ${Math.round(fibCalculations.pivots.s2).toLocaleString()}
          </span>
          <span className="text-emerald-400">
            S3: ${Math.round(fibCalculations.pivots.s3).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 4. Native TradingView Chart Container */}
      <div className="relative w-full bg-zinc-950">
        <div
          id={tvContainerId}
          className="w-full"
          style={{ height: "600px" }}
        />
      </div>

      {/* 5. Bottom Instructions / Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 bg-zinc-900/60 border-t border-zinc-800 text-[11px] text-zinc-400 gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span>
            <strong>TradingView Setup:</strong> Traditional Pivots &amp; VWAP are pre-loaded. To draw Fibs, select the Fib Retracement tool on the left toolbar and snap between Swing High (${fibCalculations.high.toLocaleString()}) and Swing Low (${fibCalculations.low.toLocaleString()}).
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-500 font-mono">
            BTC Live Feed &bull; 15m Scalp
          </span>
        </div>
      </div>
    </div>
  );
}
