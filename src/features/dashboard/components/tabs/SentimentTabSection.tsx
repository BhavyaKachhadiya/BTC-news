"use client";

import React from "react";
import { MessageSquare, ChevronRight } from "lucide-react";
import { SentimentTimeline, NewsImpactChart } from "@/features/news-sentiment";
import { NewsFeed } from "@/features/news/components/NewsFeed";
import type { SentimentTimelineSummary } from "@/features/news-sentiment";
import type { NewsItem } from "@/features/news/types/news.types";
import type { TabId } from "../../types/dashboard.types";

interface SentimentTabSectionProps {
  readonly newsSentiment: SentimentTimelineSummary | undefined;
  readonly news: readonly NewsItem[];
  readonly activeTab: TabId;
  readonly onFocusTab: (tab: TabId) => void;
}

export function SentimentTabSection({
  newsSentiment,
  news,
  activeTab,
  onFocusTab,
}: SentimentTabSectionProps) {
  return (
    <section className="space-y-6">
      {activeTab === "all" && (
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Layer 5 • News Sentiment &amp; Resolved Price Impact
              </h2>
              <p className="text-xs text-zinc-500">Timeline of high-impact headlines with resolved 1h, 4h, and 24h market price shifts</p>
            </div>
          </div>
          <button
            onClick={() => onFocusTab("sentiment")}
            className="text-xs text-btc-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            Focus Tab <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        <NewsImpactChart items={newsSentiment?.items ?? []} />

        {newsSentiment ? (
          <SentimentTimeline summary={newsSentiment} />
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6">
            <NewsFeed news={news} />
          </div>
        )}
      </div>
    </section>
  );
}
