"use client";

import React from "react";
import { Bot, Calculator } from "lucide-react";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";
import type { AnalysisPipelineOutput } from "@/features/analysis/services/orchestrator.service";
import type { MultiTimeframeAlignment } from "@/features/multi-timeframe";

interface DashboardTelemetryStripProps {
  pipelineData: AnalysisPipelineOutput;
  isJevDegraded: boolean;
  effectiveMtf: MultiTimeframeAlignment | null;
}

export function DashboardTelemetryStrip({
  pipelineData,
  isJevDegraded,
  effectiveMtf,
}: DashboardTelemetryStripProps) {
  return (
    <div className="bg-surface-800/95 border-b border-zinc-800/80 px-4 sm:px-8 py-2 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto flex items-center gap-4 text-xs whitespace-nowrap">
        {/* Live BTC Price */}
        <div className="flex items-center gap-2 pr-4 border-r border-zinc-800">
          <span className="font-mono text-zinc-400">BTC/USD:</span>
          <span className="font-bold text-white font-mono">
            {formatCurrency(pipelineData.market.price)}
          </span>
          <span
            className={`font-mono text-[11px] font-semibold ${
              pipelineData.market.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatPercent(pipelineData.market.change24h)}
          </span>
        </div>

        {/* Signal */}
        <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
          <span className="text-zinc-500">Signal:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
              pipelineData.signal.action === "LONG"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : pipelineData.signal.action === "SHORT"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            {pipelineData.signal.action} ({pipelineData.signal.confidence}%)
          </span>
        </div>

        {/* Engine Mode */}
        <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
          <span className="text-zinc-500">Mode:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              !isJevDegraded
                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                : "bg-btc-gold/20 text-btc-gold border-btc-gold/40"
            }`}
          >
            {!isJevDegraded ? (
              <>
                <Bot className="w-3 h-3 text-cyan-400" />
                Jev AI Assisted (OpenRouter)
              </>
            ) : (
              <>
                <Calculator className="w-3 h-3 text-btc-gold" />
                Pure Deterministic (Math Only)
              </>
            )}
          </span>
        </div>

        {/* MTF */}
        {effectiveMtf && (
          <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
            <span className="text-zinc-500">MTF:</span>
            <span className="text-zinc-200 capitalize font-medium">
              {effectiveMtf.overallTrend} ({effectiveMtf.alignedCount}/5)
            </span>
          </div>
        )}

        {/* Whale Positioning */}
        {pipelineData.whale && (
          <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
            <span className="text-zinc-500">Whale Bias:</span>
            <span
              className={`font-semibold ${
                pipelineData.whale.whaleBullRatio >= 0.55
                  ? "text-emerald-400"
                  : pipelineData.whale.whaleBullRatio <= 0.45
                  ? "text-rose-400"
                  : "text-zinc-300"
              }`}
            >
              {Math.round(pipelineData.whale.whaleBullRatio * 100)}% Bull
            </span>
          </div>
        )}

        {/* Funding Rate */}
        {pipelineData.derivatives && (
          <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
            <span className="text-zinc-500">Funding:</span>
            <span
              className={`font-mono ${
                pipelineData.derivatives.fundingRate > 0.03
                  ? "text-rose-400 font-bold"
                  : pipelineData.derivatives.fundingRate < 0
                  ? "text-emerald-400 font-bold"
                  : "text-zinc-300"
              }`}
            >
              {pipelineData.derivatives.fundingRate > 0 ? "+" : ""}
              {pipelineData.derivatives.fundingRate.toFixed(4)}%
            </span>
          </div>
        )}

        {/* DXY */}
        {pipelineData.macro?.dxy && (
          <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
            <span className="text-zinc-500">DXY:</span>
            <span className="font-mono text-zinc-200">
              {pipelineData.macro.dxy.value.toFixed(2)}
            </span>
            <span
              className={`text-[10px] ${
                pipelineData.macro.dxy.changePercent < 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {formatPercent(pipelineData.macro.dxy.changePercent)}
            </span>
          </div>
        )}

        {/* 10Y Yield */}
        {pipelineData.macro?.treasury?.tenYear && (
          <div className="flex items-center gap-1.5 pr-4 border-r border-zinc-800">
            <span className="text-zinc-500">10Y Yield:</span>
            <span className="font-mono text-zinc-200">
              {pipelineData.macro.treasury.tenYear.toFixed(2)}%
            </span>
          </div>
        )}

        {/* Network Gas/Fees */}
        {pipelineData.network && (
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Fast Fee:</span>
            <span className="font-mono text-zinc-200">
              {pipelineData.network.fastestFee} sat/vB
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
