"use client";

import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Minus,
  Sparkles,
  BarChart2,
  CheckCircle,
} from "lucide-react";
import { formatPercent, formatNumber } from "@/shared/utils/formatters";
import type {
  NewsSentiment,
  NewsImpact,
  SentimentNewsItem,
} from "../types/sentiment.types";

interface NewsImpactChartProps {
  readonly items: readonly SentimentNewsItem[];
  readonly overallSentiment?: NewsSentiment;
  readonly averageImpactScore?: number;
  readonly className?: string;
}

const IMPACT_COLORS: Record<NewsImpact, { bg: string; text: string; bar: string }> = {
  exceptional: { bg: "bg-purple-500/10", text: "text-purple-400", bar: "bg-purple-500" },
  high: { bg: "bg-rose-500/10", text: "text-rose-400", bar: "bg-rose-500" },
  moderate: { bg: "bg-amber-500/10", text: "text-amber-400", bar: "bg-amber-500" },
  low: { bg: "bg-sky-500/10", text: "text-sky-400", bar: "bg-sky-500" },
  negligible: { bg: "bg-zinc-800", text: "text-zinc-400", bar: "bg-zinc-600" },
};

export function NewsImpactChart({
  items,
  overallSentiment = "neutral",
  averageImpactScore = 0,
  className = "",
}: NewsImpactChartProps) {
  // 1. Calculate Sentiment Breakdown
  const sentimentCounts = useMemo(() => {
    let bullish = 0;
    let bearish = 0;
    let neutral = 0;
    let mixed = 0;

    for (const item of items) {
      if (item.sentiment === "bullish") bullish++;
      else if (item.sentiment === "bearish") bearish++;
      else if (item.sentiment === "mixed") mixed++;
      else neutral++;
    }

    const total = items.length || 1;
    return {
      bullish,
      bearish,
      neutral,
      mixed,
      total: items.length,
      pctBullish: Math.round((bullish / total) * 100),
      pctBearish: Math.round((bearish / total) * 100),
      pctNeutral: Math.round((neutral / total) * 100),
      pctMixed: Math.round((mixed / total) * 100),
    };
  }, [items]);

  // 2. Calculate Impact Tiers Distribution
  const impactCounts = useMemo(() => {
    const counts: Record<NewsImpact, number> = {
      exceptional: 0,
      high: 0,
      moderate: 0,
      low: 0,
      negligible: 0,
    };

    for (const item of items) {
      if (counts[item.impact] !== undefined) {
        counts[item.impact]++;
      }
    }

    const total = items.length || 1;
    return {
      counts,
      percentages: {
        exceptional: Math.round((counts.exceptional / total) * 100),
        high: Math.round((counts.high / total) * 100),
        moderate: Math.round((counts.moderate / total) * 100),
        low: Math.round((counts.low / total) * 100),
        negligible: Math.round((counts.negligible / total) * 100),
      },
    };
  }, [items]);

  // 3. Calculate Realized Price Outcomes by Sentiment
  const outcomeStats = useMemo(() => {
    const calculateAvgOutcome = (sentiment: NewsSentiment) => {
      const filtered = items.filter((i) => i.sentiment === sentiment && i.btcPriceAtPub);
      const with1h = filtered.filter((i) => i.btcPriceAfter1h != null);
      const with4h = filtered.filter((i) => i.btcPriceAfter4h != null);
      const with24h = filtered.filter((i) => i.btcPriceAfter24h != null);

      const avgChange1h = with1h.length
        ? with1h.reduce((acc, i) => acc + ((i.btcPriceAfter1h! - i.btcPriceAtPub!) / i.btcPriceAtPub!) * 100, 0) / with1h.length
        : null;

      const avgChange4h = with4h.length
        ? with4h.reduce((acc, i) => acc + ((i.btcPriceAfter4h! - i.btcPriceAtPub!) / i.btcPriceAtPub!) * 100, 0) / with4h.length
        : null;

      const avgChange24h = with24h.length
        ? with24h.reduce((acc, i) => acc + ((i.btcPriceAfter24h! - i.btcPriceAtPub!) / i.btcPriceAtPub!) * 100, 0) / with24h.length
        : null;

      return {
        sampleSize: filtered.length,
        resolved1h: with1h.length,
        resolved4h: with4h.length,
        resolved24h: with24h.length,
        avgChange1h,
        avgChange4h,
        avgChange24h,
      };
    };

    return {
      bullishOutcomes: calculateAvgOutcome("bullish"),
      bearishOutcomes: calculateAvgOutcome("bearish"),
    };
  }, [items]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Overall Sentiment Direction */}
        <div className="rounded-xl border border-zinc-800 bg-surface-200/60 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Aggregated Sentiment</span>
            {overallSentiment === "bullish" && <TrendingUp className="w-4 h-4 text-emerald-400" />}
            {overallSentiment === "bearish" && <TrendingDown className="w-4 h-4 text-rose-400" />}
            {overallSentiment === "mixed" && <Activity className="w-4 h-4 text-amber-400" />}
            {overallSentiment === "neutral" && <Minus className="w-4 h-4 text-zinc-400" />}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-xl font-bold uppercase tracking-wide ${
                overallSentiment === "bullish"
                  ? "text-emerald-400"
                  : overallSentiment === "bearish"
                  ? "text-rose-400"
                  : overallSentiment === "mixed"
                  ? "text-amber-400"
                  : "text-zinc-200"
              }`}
            >
              {overallSentiment}
            </span>
            <span className="text-xs text-zinc-500">
              ({sentimentCounts.bullish}B / {sentimentCounts.bearish}B)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {sentimentCounts.pctBullish}% Bullish vs {sentimentCounts.pctBearish}% Bearish
          </div>
        </div>

        {/* Metric 2: Average Impact Score */}
        <div className="rounded-xl border border-zinc-800 bg-surface-200/60 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Average Market Impact</span>
            <Sparkles className="w-4 h-4 text-btc-gold" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white tracking-tight">
              {averageImpactScore.toFixed(1)}
            </span>
            <span className="text-xs text-zinc-500">/ 10.0 scale</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {averageImpactScore >= 7
              ? "High macro sensitivity"
              : averageImpactScore >= 4
              ? "Moderate market response"
              : "Low price volatility expected"}
          </div>
        </div>

        {/* Metric 3: Total Monitored Headlines */}
        <div className="rounded-xl border border-zinc-800 bg-surface-200/60 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Correlated Headlines</span>
            <BarChart2 className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white tracking-tight">
              {formatNumber(sentimentCounts.total)}
            </span>
            <span className="text-xs text-zinc-500">articles</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            Active tracking for 1h, 4h, 24h outcomes
          </div>
        </div>
      </div>

      {/* Visual Sentiment Breakdown Meter */}
      <div className="rounded-xl border border-zinc-800 bg-surface-200/40 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300">Sentiment Distribution</span>
          <span className="text-zinc-500">{sentimentCounts.total} headlines classified</span>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="h-3 w-full rounded-full bg-zinc-900 overflow-hidden flex">
          {sentimentCounts.pctBullish > 0 && (
            <div
              style={{ width: `${sentimentCounts.pctBullish}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Bullish: ${sentimentCounts.pctBullish}%`}
            />
          )}
          {sentimentCounts.pctBearish > 0 && (
            <div
              style={{ width: `${sentimentCounts.pctBearish}%` }}
              className="bg-rose-500 transition-all duration-500"
              title={`Bearish: ${sentimentCounts.pctBearish}%`}
            />
          )}
          {sentimentCounts.pctMixed > 0 && (
            <div
              style={{ width: `${sentimentCounts.pctMixed}%` }}
              className="bg-amber-500 transition-all duration-500"
              title={`Mixed: ${sentimentCounts.pctMixed}%`}
            />
          )}
          {sentimentCounts.pctNeutral > 0 && (
            <div
              style={{ width: `${sentimentCounts.pctNeutral}%` }}
              className="bg-zinc-600 transition-all duration-500"
              title={`Neutral: ${sentimentCounts.pctNeutral}%`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">Bullish ({sentimentCounts.bullish})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-zinc-400">Bearish ({sentimentCounts.bearish})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-zinc-400">Mixed ({sentimentCounts.mixed})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
            <span className="text-zinc-400">Neutral ({sentimentCounts.neutral})</span>
          </div>
        </div>
      </div>

      {/* Impact Tiers & Price Outcome Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sub-Card 1: Impact Tiers */}
        <div className="rounded-xl border border-zinc-800 bg-surface-200/40 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            News Impact Tiers
          </h4>
          <div className="space-y-2 text-xs">
            {(
              [
                { tier: "exceptional" as NewsImpact, label: "Exceptional" },
                { tier: "high" as NewsImpact, label: "High Impact" },
                { tier: "moderate" as NewsImpact, label: "Moderate" },
                { tier: "low" as NewsImpact, label: "Low Impact" },
                { tier: "negligible" as NewsImpact, label: "Negligible" },
              ] as const
            ).map(({ tier, label }) => {
              const count = impactCounts.counts[tier];
              const pct = impactCounts.percentages[tier];
              const style = IMPACT_COLORS[tier];

              return (
                <div key={tier} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className={`font-medium ${style.text}`}>{label}</span>
                    <span className="text-zinc-400">
                      {count} <span className="text-zinc-600">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full ${style.bar} transition-all duration-300`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sub-Card 2: Realized Price Outcome Performance */}
        <div className="rounded-xl border border-zinc-800 bg-surface-200/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Post-News BTC Price Outcomes
            </h4>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              Empirical
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Bullish News Outcome Row */}
            <div className="rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-850">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/80 mb-2">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Bullish Headlines
                </span>
                <span className="text-[11px] text-zinc-500">
                  {outcomeStats.bullishOutcomes.sampleSize} articles
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-zinc-500">+1 Hour</div>
                  <div
                    className={`font-mono text-xs font-semibold ${
                      (outcomeStats.bullishOutcomes.avgChange1h ?? 0) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {outcomeStats.bullishOutcomes.avgChange1h != null
                      ? formatPercent(outcomeStats.bullishOutcomes.avgChange1h)
                      : "Pending"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500">+4 Hours</div>
                  <div
                    className={`font-mono text-xs font-semibold ${
                      (outcomeStats.bullishOutcomes.avgChange4h ?? 0) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {outcomeStats.bullishOutcomes.avgChange4h != null
                      ? formatPercent(outcomeStats.bullishOutcomes.avgChange4h)
                      : "Pending"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500">+24 Hours</div>
                  <div
                    className={`font-mono text-xs font-semibold ${
                      (outcomeStats.bullishOutcomes.avgChange24h ?? 0) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {outcomeStats.bullishOutcomes.avgChange24h != null
                      ? formatPercent(outcomeStats.bullishOutcomes.avgChange24h)
                      : "Pending"}
                  </div>
                </div>
              </div>
            </div>

            {/* Bearish News Outcome Row */}
            <div className="rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-850">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/80 mb-2">
                <span className="font-semibold text-rose-400 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> Bearish Headlines
                </span>
                <span className="text-[11px] text-zinc-500">
                  {outcomeStats.bearishOutcomes.sampleSize} articles
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-zinc-500">+1 Hour</div>
                  <div
                    className={`font-mono text-xs font-semibold ${
                      (outcomeStats.bearishOutcomes.avgChange1h ?? 0) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {outcomeStats.bearishOutcomes.avgChange1h != null
                      ? formatPercent(outcomeStats.bearishOutcomes.avgChange1h)
                      : "Pending"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500">+4 Hours</div>
                  <div
                    className={`font-mono text-xs font-semibold ${
                      (outcomeStats.bearishOutcomes.avgChange4h ?? 0) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {outcomeStats.bearishOutcomes.avgChange4h != null
                      ? formatPercent(outcomeStats.bearishOutcomes.avgChange4h)
                      : "Pending"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500">+24 Hours</div>
                  <div
                    className={`font-mono text-xs font-semibold ${
                      (outcomeStats.bearishOutcomes.avgChange24h ?? 0) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {outcomeStats.bearishOutcomes.avgChange24h != null
                      ? formatPercent(outcomeStats.bearishOutcomes.avgChange24h)
                      : "Pending"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
