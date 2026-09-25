"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Minus,
  ExternalLink,
  Clock,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatCurrency, formatPercent, formatTimestamp } from "@/shared/utils/formatters";
import { NewsImpactChart } from "./NewsImpactChart";
import type {
  NewsSentiment,
  NewsImpact,
  SentimentNewsItem,
  SentimentTimelineSummary,
} from "../types/sentiment.types";

interface SentimentTimelineProps {
  readonly summary: SentimentTimelineSummary;
  readonly className?: string;
  readonly initialShowChart?: boolean;
}

const SENTIMENT_STYLES: Record<
  NewsSentiment,
  { label: string; badge: string; dot: string; icon: React.ComponentType<{ className?: string }> }
> = {
  bullish: {
    label: "Bullish",
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    dot: "bg-emerald-500 ring-4 ring-emerald-500/20",
    icon: TrendingUp,
  },
  bearish: {
    label: "Bearish",
    badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    dot: "bg-rose-500 ring-4 ring-rose-500/20",
    icon: TrendingDown,
  },
  mixed: {
    label: "Mixed",
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dot: "bg-amber-500 ring-4 ring-amber-500/20",
    icon: Activity,
  },
  neutral: {
    label: "Neutral",
    badge: "bg-zinc-800 text-zinc-400 border border-zinc-700",
    dot: "bg-zinc-600 ring-4 ring-zinc-700/20",
    icon: Minus,
  },
};

const IMPACT_BADGES: Record<NewsImpact, { label: string; style: string }> = {
  exceptional: {
    label: "Exceptional Impact",
    style: "bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-xs shadow-purple-500/20",
  },
  high: {
    label: "High Impact",
    style: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  },
  moderate: {
    label: "Moderate",
    style: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
  low: {
    label: "Low Impact",
    style: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  },
  negligible: {
    label: "Negligible",
    style: "bg-zinc-900 text-zinc-500 border border-zinc-800",
  },
};

export function SentimentTimeline({
  summary,
  className = "",
  initialShowChart = true,
}: SentimentTimelineProps) {
  const [selectedSentiment, setSelectedSentiment] = useState<NewsSentiment | "all">("all");
  const [selectedImpact, setSelectedImpact] = useState<NewsImpact | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "score-desc">("date-desc");
  const [showChart, setShowChart] = useState<boolean>(initialShowChart);

  // Compute filtered & sorted items
  const filteredItems = useMemo(() => {
    return summary.items
      .filter((item) => {
        if (selectedSentiment !== "all" && item.sentiment !== selectedSentiment) {
          return false;
        }
        if (selectedImpact !== "all" && item.impact !== selectedImpact) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = item.title.toLowerCase().includes(q);
          const matchesSource = item.source?.toLowerCase().includes(q) ?? false;
          if (!matchesTitle && !matchesSource) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date-asc") {
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        }
        if (sortBy === "score-desc") {
          return Math.abs(b.score) - Math.abs(a.score);
        }
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
  }, [summary.items, selectedSentiment, selectedImpact, searchQuery, sortBy]);

  // Counts for sentiment filter pills
  const counts = useMemo(() => {
    let bullish = 0;
    let bearish = 0;
    let mixed = 0;
    let neutral = 0;

    for (const item of summary.items) {
      if (item.sentiment === "bullish") bullish++;
      else if (item.sentiment === "bearish") bearish++;
      else if (item.sentiment === "mixed") mixed++;
      else neutral++;
    }

    return { all: summary.items.length, bullish, bearish, mixed, neutral };
  }, [summary.items]);

  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl space-y-6 ${className}`}
    >
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                News Sentiment & Price Impact Timeline
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                1h • 4h • 24h Correlated
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Correlating macro & crypto news catalysts with subsequent Bitcoin price action
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowChart((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
        >
          <BarChart3 className="w-4 h-4 text-btc-gold" />
          <span>{showChart ? "Hide Analytics" : "Show Analytics"}</span>
          {showChart ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Analytics Chart Drawer */}
      {showChart && (
        <NewsImpactChart
          items={summary.items}
          overallSentiment={summary.overallSentiment}
          averageImpactScore={summary.averageImpactScore}
        />
      )}

      {/* Filter & Search Bar */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Sentiment Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-zinc-500 text-xs mr-1 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" /> Sentiment:
            </span>
            {(
              [
                { id: "all", label: "All", count: counts.all },
                { id: "bullish", label: "Bullish", count: counts.bullish },
                { id: "bearish", label: "Bearish", count: counts.bearish },
                { id: "mixed", label: "Mixed", count: counts.mixed },
                { id: "neutral", label: "Neutral", count: counts.neutral },
              ] as const
            ).map(({ id, label, count }) => {
              const active = selectedSentiment === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedSentiment(id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer text-xs ${
                    active
                      ? "bg-btc-gold text-black shadow-xs font-semibold"
                      : "bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800"
                  }`}
                >
                  {label} <span className="opacity-75 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search headline or source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-btc-gold/50"
            />
          </div>
        </div>

        {/* Secondary Filter: Impact & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-medium">Impact Level:</span>
            <select
              value={selectedImpact}
              onChange={(e) => setSelectedImpact(e.target.value as NewsImpact | "all")}
              aria-label="Filter news by impact level"
              className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-btc-gold/50"
            >
              <option value="all">All Impact Tiers</option>
              <option value="exceptional">Exceptional Impact</option>
              <option value="high">High Impact</option>
              <option value="moderate">Moderate Impact</option>
              <option value="low">Low Impact</option>
              <option value="negligible">Negligible</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "date-desc" | "date-asc" | "score-desc")
              }
              aria-label="Sort news items"
              className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-btc-gold/50"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="score-desc">Highest Polarity Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Interactive Timeline Stream */}
      <div className="relative pt-2">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
            No news items found matching the selected filters.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-800">
            {filteredItems.map((item) => {
              const sentimentConfig = SENTIMENT_STYLES[item.sentiment];
              const impactConfig = IMPACT_BADGES[item.impact];
              const Icon = sentimentConfig.icon;

              // Price change calculations
              const p1Change =
                item.btcPriceAfter1h && item.btcPriceAtPub
                  ? ((item.btcPriceAfter1h - item.btcPriceAtPub) / item.btcPriceAtPub) * 100
                  : null;

              const p4Change =
                item.btcPriceAfter4h && item.btcPriceAtPub
                  ? ((item.btcPriceAfter4h - item.btcPriceAtPub) / item.btcPriceAtPub) * 100
                  : null;

              const p24Change =
                item.btcPriceAfter24h && item.btcPriceAtPub
                  ? ((item.btcPriceAfter24h - item.btcPriceAtPub) / item.btcPriceAtPub) * 100
                  : null;

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <div
                    className={`absolute -left-[27px] sm:-left-[35px] top-1.5 w-3.5 h-3.5 rounded-full ${sentimentConfig.dot} transition-transform group-hover:scale-125`}
                  />

                  {/* News Event Card */}
                  <div className="rounded-xl border border-zinc-800 bg-surface-200/40 hover:bg-surface-200/70 p-4 transition-all duration-200 hover:border-zinc-700 space-y-3">
                    {/* Meta Row: Source, Published Time, Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.source && (
                          <span className="font-semibold text-zinc-300 text-[10px] uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                            {item.source}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-zinc-500 text-[11px]">
                          <Clock className="w-3 h-3 text-zinc-600" />
                          {formatTimestamp(item.publishedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Sentiment Badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${sentimentConfig.badge}`}
                        >
                          <Icon className="w-3 h-3" />
                          {sentimentConfig.label}
                        </span>

                        {/* Impact Badge */}
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${impactConfig.style}`}
                        >
                          {impactConfig.label}
                        </span>

                        {/* Polarity Score */}
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 ${
                            item.score > 0
                              ? "text-emerald-400"
                              : item.score < 0
                              ? "text-rose-400"
                              : "text-zinc-400"
                          }`}
                          title="Normalized Polarity Score (-1 to +1)"
                        >
                          {item.score > 0 ? `+${item.score.toFixed(2)}` : item.score.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Headline Title */}
                    <div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-zinc-100 group-hover:text-btc-gold transition-colors inline-flex items-start gap-1.5 leading-snug"
                      >
                        <span>{item.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-btc-gold flex-shrink-0 mt-0.5" />
                      </a>
                    </div>

                    {/* Correlated BTC Price Outcome Grid */}
                    <div className="pt-1">
                      <div className="rounded-lg bg-zinc-900/80 border border-zinc-850 p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        {/* Price at Publication */}
                        <div className="border-r border-zinc-800/80 last:border-r-0">
                          <div className="text-[10px] text-zinc-500 font-medium">BTC at Pub</div>
                          <div className="font-mono text-xs font-semibold text-zinc-200 mt-0.5">
                            {item.btcPriceAtPub ? formatCurrency(item.btcPriceAtPub) : "—"}
                          </div>
                        </div>

                        {/* 1h Outcome */}
                        <div className="border-r border-zinc-800/80 last:border-r-0">
                          <div className="text-[10px] text-zinc-500 font-medium">+1h Outcome</div>
                          {item.btcPriceAfter1h && p1Change !== null ? (
                            <div className="mt-0.5">
                              <span
                                className={`font-mono text-xs font-semibold ${
                                  p1Change >= 0 ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {formatPercent(p1Change)}
                              </span>
                              <div className="text-[9px] text-zinc-500 font-mono">
                                {formatCurrency(item.btcPriceAfter1h, 0)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-zinc-600 italic mt-0.5">Pending</div>
                          )}
                        </div>

                        {/* 4h Outcome */}
                        <div className="border-r border-zinc-800/80 last:border-r-0">
                          <div className="text-[10px] text-zinc-500 font-medium">+4h Outcome</div>
                          {item.btcPriceAfter4h && p4Change !== null ? (
                            <div className="mt-0.5">
                              <span
                                className={`font-mono text-xs font-semibold ${
                                  p4Change >= 0 ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {formatPercent(p4Change)}
                              </span>
                              <div className="text-[9px] text-zinc-500 font-mono">
                                {formatCurrency(item.btcPriceAfter4h, 0)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-zinc-600 italic mt-0.5">Pending</div>
                          )}
                        </div>

                        {/* 24h Outcome */}
                        <div>
                          <div className="text-[10px] text-zinc-500 font-medium">+24h Outcome</div>
                          {item.btcPriceAfter24h && p24Change !== null ? (
                            <div className="mt-0.5">
                              <span
                                className={`font-mono text-xs font-semibold ${
                                  p24Change >= 0 ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {formatPercent(p24Change)}
                              </span>
                              <div className="text-[9px] text-zinc-500 font-mono">
                                {formatCurrency(item.btcPriceAfter24h, 0)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-zinc-600 italic mt-0.5">Pending</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
