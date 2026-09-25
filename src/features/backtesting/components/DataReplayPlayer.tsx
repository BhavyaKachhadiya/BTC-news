"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Gauge,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  generateCandlesForScenario,
  MARKET_SCENARIOS,
  type MarketScenario,
} from "../data/sample-candles";
import { DataReplayEngine, type ReplayStateAtStep } from "../services/replay.service";
import { DEFAULT_STRATEGY_PARAMETERS } from "@/features/strategy-lab/types/strategy.types";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";

export function DataReplayPlayer() {
  const [scenario, setScenario] = useState<MarketScenario>("bull_run");
  const [currentStep, setCurrentStep] = useState<number>(30); // Start after warmup
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x

  const candles = useMemo(() => generateCandlesForScenario(scenario), [scenario]);
  const engine = useMemo(() => new DataReplayEngine(candles, DEFAULT_STRATEGY_PARAMETERS), [candles]);

  const state: ReplayStateAtStep = useMemo(() => {
    return engine.evaluateStep(currentStep);
  }, [engine, currentStep]);

  // Playback timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stepForward = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= candles.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [candles.length]);

  const stepBackward = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const resetReplay = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(30); // reset to warmup index
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const delayMs = Math.max(80, Math.floor(400 / playbackSpeed));
      timerRef.current = setInterval(stepForward, delayMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, stepForward]);

  // Mini Chart Visualization
  const chartCandles = useMemo(() => candles.slice(0, currentStep + 1), [candles, currentStep]);
  const minPrice = useMemo(() => Math.min(...chartCandles.map((c) => c.low)) * 0.99, [chartCandles]);
  const maxPrice = useMemo(() => Math.max(...chartCandles.map((c) => c.high)) * 1.01, [chartCandles]);
  const priceRange = maxPrice - minPrice || 1;

  const points = chartCandles
    .map((c, i) => {
      const x = (i / (candles.length - 1)) * 500;
      const y = 140 - ((c.close - minPrice) / priceRange) * 120;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const currentX = (currentStep / (candles.length - 1)) * 500;
  const currentY = 140 - ((state.currentCandle.close - minPrice) / priceRange) * 120;

  const signalColor =
    state.signal === "LONG"
      ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
      : state.signal === "SHORT"
      ? "text-rose-400 bg-rose-500/15 border-rose-500/30"
      : "text-amber-400 bg-amber-500/15 border-amber-500/30";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-btc-gold/10 text-btc-gold border border-btc-gold/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
              Interactive Historical Data Replay
            </h2>
            <p className="text-xs text-zinc-500">Step candle-by-candle through history with zero look-ahead bias</p>
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Scenario:</span>
          <select
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value as MarketScenario);
              resetReplay();
            }}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-btc-gold cursor-pointer"
          >
            {Object.values(MARKET_SCENARIOS).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SVG Trajectory Chart */}
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Replay Trajectory (Candles 1 to {currentStep + 1} of {candles.length})</span>
          <span className="text-white font-bold">{formatCurrency(state.currentCandle.close, 0)}</span>
        </div>

        <div className="h-36 w-full relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 140" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="20" x2="500" y2="20" stroke="#27272a" strokeDasharray="3 3" />
            <line x1="0" y1="70" x2="500" y2="70" stroke="#27272a" strokeDasharray="3 3" />
            <line x1="0" y1="120" x2="500" y2="120" stroke="#27272a" strokeDasharray="3 3" />

            {/* Polyline */}
            <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={points} />

            {/* Head point */}
            <circle cx={currentX} cy={currentY} r="5" fill="#f59e0b" className="animate-pulse" />
          </svg>
        </div>

        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>{candles[0].timestamp.slice(0, 10)}</span>
          <span>Current: {state.currentCandle.timestamp.slice(0, 10)}</span>
          <span>{candles[candles.length - 1].timestamp.slice(0, 10)}</span>
        </div>
      </div>

      {/* Playback Controls & Scrubber */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={resetReplay}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              title="Reset to start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={stepBackward}
              disabled={currentStep <= 0}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition disabled:opacity-40 cursor-pointer"
              title="Step backward"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-btc-gold text-zinc-950 font-bold text-xs hover:bg-btc-gold/90 transition shadow-lg shadow-btc-gold/10 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Pause" : "Play Replay"}
            </button>
            <button
              onClick={stepForward}
              disabled={currentStep >= candles.length - 1}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition disabled:opacity-40 cursor-pointer"
              title="Step forward 1 candle"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500">Speed:</span>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition cursor-pointer ${
                  playbackSpeed === spd
                    ? "bg-btc-gold text-zinc-950"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono text-zinc-400">
            <span>Candle Index: {currentStep + 1} / {candles.length}</span>
            <span>Progress: {Math.round(((currentStep + 1) / candles.length) * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={candles.length - 1}
            value={currentStep}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentStep(Number(e.target.value));
            }}
            className="w-full accent-btc-gold cursor-pointer"
          />
        </div>
      </div>

      {/* Real-time Indicator & Signal Inspection at Current Candle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Indicators at Step */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-btc-gold" />
            <span>Calculated Indicators at Candle #{currentStep + 1}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px]">RSI (14)</span>
              <div className="text-lg font-bold font-mono text-white">
                {state.rsi !== null ? state.rsi.toFixed(1) : "Warmup..."}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px]">ATR (14)</span>
              <div className="text-lg font-bold font-mono text-white">
                {state.atr !== null ? formatCurrency(state.atr, 0) : "Warmup..."}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px]">Fast EMA (12)</span>
              <div className="text-lg font-bold font-mono text-cyan-400">
                {state.emaFast !== null ? formatCurrency(state.emaFast, 0) : "Warmup..."}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px]">Slow EMA (26)</span>
              <div className="text-lg font-bold font-mono text-indigo-400">
                {state.emaSlow !== null ? formatCurrency(state.emaSlow, 0) : "Warmup..."}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Deterministic Signal at Step */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Evaluated Signal
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${signalColor}`}>
                {state.signal} ({state.confidence}%)
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/80">
              {state.signalReason}
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>OHLC: O={state.currentCandle.open.toFixed(0)} H={state.currentCandle.high.toFixed(0)} L={state.currentCandle.low.toFixed(0)} C={state.currentCandle.close.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
