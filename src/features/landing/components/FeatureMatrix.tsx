"use client";

import React from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import type { FeatureCard } from "../types/landing.types";

interface FeatureMatrixProps {
  categories: readonly string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  features: readonly FeatureCard[];
}

export function FeatureMatrix({
  categories,
  selectedCategory,
  onSelectCategory,
  features,
}: FeatureMatrixProps) {
  return (
    <section id="features" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-btc-gold/30 bg-btc-gold/10 text-btc-gold text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Core Intelligence Stack (8 Features)
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Core Feature Specification</h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            The 8 essential market intelligence capabilities powering our deterministic pipelines and live terminal.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-btc-gold text-black font-semibold shadow-sm"
                  : "bg-surface-50 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Cards Grid (2-Column Balanced) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feat) => (
          <div
            key={feat.id}
            className="p-5 rounded-xl border border-zinc-800/80 bg-surface-50/50 hover:bg-surface-50 glass-card-hover flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-btc-gold font-bold">#{feat.id}</span>
                <span className="flex items-center gap-1 text-[11px] text-signal-long font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  100% Implemented
                </span>
              </div>
              <h3 className="font-bold text-white text-base">{feat.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500 font-mono">{feat.category}</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700">
                {feat.highlight}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
