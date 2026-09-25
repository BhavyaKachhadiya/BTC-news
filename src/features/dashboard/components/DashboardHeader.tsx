"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Sparkles,
  Clock,
  RefreshCw,
  Calculator,
  Bot,
  RotateCw,
  Play,
} from "lucide-react";
import { WebNotificationBell } from "@/features/alerts";

interface DashboardHeaderProps {
  engineMode: "deterministic" | "jev";
  isModeLoading: boolean;
  isAnalyzing: boolean;
  lastRefreshed: string;
  isJevDegraded: boolean;
  pipelineDataLoaded: boolean;
  onModeToggle: (mode: "deterministic" | "jev") => void;
  onTriggerAnalysis: () => void;
}

export function DashboardHeader({
  engineMode,
  isModeLoading,
  isAnalyzing,
  lastRefreshed,
  isJevDegraded,
  pipelineDataLoaded,
  onModeToggle,
  onTriggerAnalysis,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-surface-900/95 backdrop-blur-md px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-surface-800 text-zinc-400 hover:text-white transition-colors"
            title="Return to Landing Page"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-btc-gold to-amber-600 flex items-center justify-center shadow-lg shadow-btc-gold/20 flex-shrink-0">
            <span className="font-extrabold text-black text-lg">₿</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">BTC Signal Engine</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Paper Trading Only
              </span>

              {pipelineDataLoaded && (
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    !isJevDegraded
                      ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                      : "bg-btc-gold/10 text-btc-gold border-btc-gold/30"
                  }`}
                  title={
                    !isJevDegraded
                      ? "Jev AI synthesis active"
                      : "Jev unavailable or disabled; pure deterministic fallback active"
                  }
                >
                  {!isJevDegraded ? (
                    <>
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Mode: Jev AI Assisted</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 text-btc-gold" />
                      <span>Mode: Pure Deterministic</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Autonomous Quantitative Telemetry • Jev Qualitative Interpretation • Multi-Horizon Deterministic Synthesis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Updated: {lastRefreshed}</span>
            </div>
          )}

          {/* Engine Mode Toggle */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => onModeToggle("deterministic")}
              disabled={isModeLoading}
              title="Pure Deterministic Mode — zero AI, 100% math (EMA, RSI, MTF, Whale, Derivatives)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer ${
                engineMode === "deterministic"
                  ? "bg-btc-gold/20 text-btc-gold border border-btc-gold/40 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              {isModeLoading && engineMode !== "deterministic" ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Calculator className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">Math</span>
            </button>

            <button
              onClick={() => onModeToggle("jev")}
              disabled={isModeLoading}
              title="Jev AI Assisted Mode — OpenRouter ~typesafe/jev-latest"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer ${
                engineMode === "jev"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              {isModeLoading && engineMode !== "jev" ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Bot className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">Jev AI</span>
            </button>
          </div>

          {/* Web Alert Notification Bell */}
          <WebNotificationBell />

          <button
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-btc-gold hover:bg-btc-accent text-black font-semibold text-xs tracking-wide transition-all shadow-md shadow-btc-gold/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Running Pipeline...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Analysis Now
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
