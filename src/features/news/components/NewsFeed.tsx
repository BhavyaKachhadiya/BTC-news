"use client";

import React, { useState, useMemo } from "react";
import { Newspaper, ExternalLink, Clock, Search, Filter } from "lucide-react";
import { formatTimestamp } from "@/shared/utils/formatters";
import type { NewsItem } from "../types/news.types";

interface NewsFeedProps {
  news: readonly NewsItem[];
}

export function NewsFeed({ news }: NewsFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");

  // Calculate unique sources and their counts
  const sourceStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of news) {
      const src = item.source || "Unknown";
      counts[src] = (counts[src] || 0) + 1;
    }
    return counts;
  }, [news]);

  const uniqueSources = useMemo(() => {
    return Object.keys(sourceStats).sort((a, b) => (sourceStats[b] ?? 0) - (sourceStats[a] ?? 0));
  }, [sourceStats]);

  // Filtered headlines
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesSource =
        selectedSource === "ALL" || (item.source || "Unknown") === selectedSource;

      if (!matchesSource) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const titleMatches = item.title.toLowerCase().includes(q);
      const descMatches = item.description?.toLowerCase().includes(q) ?? false;
      const srcMatches = item.source?.toLowerCase().includes(q) ?? false;

      return titleMatches || descMatches || srcMatches;
    });
  }, [news, selectedSource, searchQuery]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
              Bitcoin Intelligence Feed
            </h2>
            <div className="text-xs text-zinc-500">Curated Multi-Source RSS & Media</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            {filteredNews.length === news.length
              ? `${news.length} Headlines`
              : `${filteredNews.length} of ${news.length} Headlines`}
          </span>
        </div>
      </div>

      {/* Search & Source Filter Controls */}
      <div className="space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search news headlines, topics, or sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-btc-gold/50"
          />
        </div>

        {/* Source Filter Badges */}
        {uniqueSources.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 flex-shrink-0">
              <Filter className="w-3 h-3 text-zinc-500" /> Source:
            </span>

            <button
              onClick={() => setSelectedSource("ALL")}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors flex-shrink-0 cursor-pointer ${
                selectedSource === "ALL"
                  ? "bg-btc-gold text-black font-semibold"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              All ({news.length})
            </button>

            {uniqueSources.map((source) => {
              const count = sourceStats[source] ?? 0;
              const isSelected = selectedSource === source;

              return (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-btc-gold text-black font-semibold"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {source} <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* News Stream List */}
      <div className="divide-y divide-zinc-850 max-h-[420px] overflow-y-auto pr-1">
        {filteredNews.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800/80 rounded-xl">
            {news.length === 0
              ? "No news items currently loaded. Run analysis to fetch latest headlines."
              : "No headlines match the current filter or search criteria."}
          </div>
        ) : (
          filteredNews.map((item, idx) => (
            <div key={`${item.url}-${idx}`} className="py-3 first:pt-0 last:pb-0 group">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-medium text-zinc-200 group-hover:text-btc-gold transition-colors leading-snug"
              >
                {item.title}
              </a>

              {item.description && (
                <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                {item.source && (
                  <span className="font-semibold text-zinc-400 uppercase text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    {item.source}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-600" />
                  {formatTimestamp(item.publishedAt)}
                </span>
                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-btc-gold transition-colors ml-auto" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
