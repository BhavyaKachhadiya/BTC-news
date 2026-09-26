"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";

const PIPELINE_STEPS = [
  {
    title: "Network & On-Chain Telemetry",
    desc: "Mempool fees, congestion, block tip, hashrate",
    logs: [
      "Pinging Mempool.space...",
      "Fetching block tip height...",
      "Calculating hashrate...",
      "Evaluating network congestion..."
    ],
  },
  {
    title: "Multi-Timeframe Kline Aggregation",
    desc: "5m, 15m, 1h, 4h, 1D candles from public mirrors & Bybit fallback",
    logs: [
      "Fetching 5m candles...",
      "Fetching 15m candles...",
      "Fetching 1h candles...",
      "Fetching 4h candles...",
      "Fetching 1D candles...",
      "Normalizing timestamp formats...",
      "Ingesting 60 candles per timeframe..."
    ],
  },
  {
    title: "Quantitative Indicators",
    desc: "RSI, EMA, MACD, Bollinger Bands, Supertrend, VWAP, Stochastic, ADX",
    logs: [
      "Calculating RSI & MACD...",
      "Applying Bollinger Bands...",
      "Computing VWAP and ADX...",
      "Evaluating Supertrend parameters..."
    ],
  },
  {
    title: "Market Structure & Price Action",
    desc: "Swing High/Low, BoS, S/R, Order Blocks, Liquidity Sweeps",
    logs: [
      "Identifying Swing Highs/Lows...",
      "Detecting Break of Structure (BoS)...",
      "Mapping Support & Resistance levels...",
      "Calculating Volume Profile POC and Value Area...",
      "Marking Order Blocks...",
      "Detecting Liquidity Sweeps..."
    ],
  },
  {
    title: "Derivatives & Whale Positioning",
    desc: "Hyperliquid top 20 whales, funding rates, open interest, L/S ratio",
    logs: [
      "Connecting to Hyperliquid L1...",
      "Evaluating Hyperliquid whale positioning...",
      "Aggregating Funding Rates...",
      "Calculating Long/Short ratio..."
    ],
  },
  {
    title: "Macroeconomic Ingestion",
    desc: "DXY, US 10Y/2Y Yields, Gold, S&P 500",
    logs: [
      "Fetching DXY...",
      "Reading US 10Y/2Y yields...",
      "Correlating Gold & S&P 500..."
    ],
  },
  {
    title: "Real-Time News & Sentiment Matrix",
    desc: "11 RSS feeds, sentiment scoring, price correlation",
    logs: [
      "Ingesting 11 RSS feeds...",
      "Parsing HTML content...",
      "Scoring sentiment matrix...",
      "Correlating with price action..."
    ],
  },
  {
    title: "Deterministic Synthesis & Execution",
    desc: "Directional signal, confidence score, risk parameters, paper trading",
    logs: [
      "Synthesizing inputs...",
      "Calculating confidence score...",
      "Generating risk parameters...",
      "Finalizing directional signal..."
    ],
  },
];

export function MultiStepLoader({
  onComplete,
  isDataReady,
}: {
  onComplete?: () => void;
  isDataReady?: boolean;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [logIndex, setLogIndex] = useState(0);

  // Overall timer
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // When data is ready, instantly jump to complete
  useEffect(() => {
    if (isDataReady) {
      setCurrentStep(PIPELINE_STEPS.length);
      setProgress(100);
      if (onComplete) {
        const t = setTimeout(onComplete, 300);
        return () => clearTimeout(t);
      }
    }
  }, [isDataReady, onComplete]);

  // Step progression and logs
  useEffect(() => {
    if (currentStep >= PIPELINE_STEPS.length) {
      setProgress(100);
      if (onComplete) {
        // Small delay to show 100% completion before unmounting or signaling complete
        const t = setTimeout(onComplete, 300);
        return () => clearTimeout(t);
      }
      return;
    }

    const stepDuration = 250; // Snappy duration per step in ms
    const logsCount = PIPELINE_STEPS[currentStep].logs.length;
    const logDuration = Math.max(stepDuration / logsCount, 40);

    const logInterval = setInterval(() => {
      setLogIndex((prev) => Math.min(prev + 1, logsCount - 1));
    }, logDuration);

    const stepTimeout = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
      setLogIndex(0);
    }, stepDuration);

    // Smooth progress bar update
    const progressInterval = setInterval(() => {
      setProgress(() => {
        const base = (currentStep / PIPELINE_STEPS.length) * 100;
        const stepProgress = Math.min(
          1,
          (logsCount === 0 ? 1 : logIndex / logsCount) + 0.1
        );
        const subProgress = stepProgress * (100 / PIPELINE_STEPS.length);
        return Math.min(base + subProgress, 100);
      });
    }, 50);

    return () => {
      clearInterval(logInterval);
      clearTimeout(stepTimeout);
      clearInterval(progressInterval);
    };
  }, [currentStep, logIndex, onComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-900 text-zinc-300">
      <div className="p-6 rounded-2xl bg-surface-800/80 border border-zinc-800 flex flex-col max-w-4xl w-full space-y-6 shadow-2xl">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Initializing BTC Intelligence Engine
          </h2>
          <div className="text-xs text-zinc-400 mt-1">
            Running multi-step deterministic pipeline
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs font-mono text-zinc-400">
            <span>{progress.toFixed(1)}%</span>
            <span>{(elapsedMs / 1000).toFixed(2)}s</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-btc-gold rounded-full transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PIPELINE_STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  isActive
                    ? "bg-zinc-800/50 border-btc-gold/30"
                    : isCompleted
                    ? "bg-surface-800 border-zinc-800"
                    : "bg-surface-800/50 border-transparent opacity-50"
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-btc-gold animate-spin" />
                  ) : (
                    <CircleDashed className="w-5 h-5 text-zinc-600" />
                  )}
                </div>
                <div>
                  <div
                    className={`text-sm font-semibold ${
                      isActive
                        ? "text-btc-gold"
                        : isCompleted
                        ? "text-zinc-100"
                        : "text-zinc-500"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-zinc-500 line-clamp-1">
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Terminal Telemetry */}
        <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800 font-mono text-xs text-zinc-400 h-24 overflow-hidden relative flex flex-col justify-end">
          <div className="flex flex-col gap-1 justify-end">
            {currentStep < PIPELINE_STEPS.length && (
              <div className="text-emerald-500 flex gap-2">
                <span>&gt;</span>
                <span className="animate-pulse">
                  {PIPELINE_STEPS[currentStep].logs[logIndex]}
                </span>
              </div>
            )}
            {currentStep === PIPELINE_STEPS.length && (
              <div className="text-emerald-500 flex gap-2">
                <span>&gt;</span>
                <span>Pipeline execution complete. Rendering dashboard...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
