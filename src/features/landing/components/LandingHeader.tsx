"use client";

import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#060608]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-btc-gold to-amber-600 flex items-center justify-center shadow-lg shadow-btc-gold/20">
            <span className="font-extrabold text-black text-lg">₿</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">SatoshiSignal</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-btc-gold/15 text-btc-gold border border-btc-gold/30 font-semibold">
                QUANT v2.0
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Autonomous Bitcoin Directional Intelligence &amp; Quant Terminal
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
          <a href="#features" className="hover:text-btc-gold transition-colors">
            Features
          </a>
          <a href="#terminal-preview" className="hover:text-btc-gold transition-colors">
            Live Preview
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-btc-gold to-amber-500 hover:from-amber-400 hover:to-btc-gold text-black font-semibold text-sm transition-all shadow-md shadow-btc-gold/20 hover:shadow-btc-gold/30 hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Launch Terminal</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
