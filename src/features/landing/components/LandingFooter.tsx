"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-800/80 bg-[#050507] pt-16 pb-12 px-4 sm:px-6 text-sm text-zinc-400">
      <div className="max-w-7xl mx-auto">
        {/* Main 4-Column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-zinc-800/80">
          {/* Brand & Mission (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-btc-gold to-amber-600 flex items-center justify-center shadow-lg shadow-btc-gold/20">
                <span className="font-extrabold text-black text-base">₿</span>
              </div>
              <span className="font-bold tracking-tight text-white text-base">SatoshiSignal</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-btc-gold/15 text-btc-gold border border-btc-gold/30 font-semibold">
                QUANT v2.0
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              Institutional-grade Bitcoin market intelligence combining deterministic technical indicators,
              live mempool flows, whale positioning, and macroeconomic liquidity metrics into verifiable paper trading signals.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Engine Systems Operational</span>
            </div>
          </div>

          {/* Column 1: Terminal & Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="hover:text-btc-gold transition-colors">
                  Live Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard?tab=multi-timeframe" className="hover:text-btc-gold transition-colors">
                  Multi-Timeframe Engine
                </Link>
              </li>
              <li>
                <Link href="/dashboard?tab=whale" className="hover:text-btc-gold transition-colors">
                  Whale Radar & Flows
                </Link>
              </li>
              <li>
                <Link href="/dashboard?tab=derivatives-macro" className="hover:text-btc-gold transition-colors">
                  Macro & FOMC Calendar
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Data & Integrations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">Live Ingestion</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-zinc-300 font-medium">Binance REST & WebSocket</span>
              </li>
              <li>
                <span className="text-zinc-300 font-medium">Mempool.space Fees & Blocks</span>
              </li>
              <li>
                <span className="text-zinc-300 font-medium">Yahoo Finance (DXY & Yields)</span>
              </li>
              <li>
                <span className="text-zinc-300 font-medium">Hyperliquid Whale Books</span>
              </li>
              <li>
                <span className="text-zinc-300 font-medium">CryptoPanic News Sentiment</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Safety */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">Risk & Safety</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paper Trading Only</span>
              </li>
              <li>
                <span className="text-zinc-400">Zero Real Capital Risk</span>
              </li>
              <li>
                <span className="text-zinc-400">Deterministic Logic</span>
              </li>
              <li>
                <span className="text-zinc-400">Automatic Fallback Mode</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            © {new Date().getFullYear()} SatoshiSignal™. All rights reserved. Pure TypeScript &amp; Next.js 15.
          </div>
          <div className="text-center sm:text-right text-[11px] text-zinc-500 max-w-md">
            Disclaimer: Strictly for educational, quantitative research, and paper simulation purposes. Does not constitute financial or investment advice.
          </div>
        </div>
      </div>
    </footer>
  );
}
