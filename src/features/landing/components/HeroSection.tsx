"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Activity, ArrowRight, ChevronRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="pt-16 pb-14 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-8">
      {/* Top Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-btc-gold/30 bg-btc-gold/10 text-btc-gold text-xs font-semibold tracking-wide uppercase shadow-sm shadow-btc-gold/10 animate-fade-in">
        <ShieldCheck className="w-4 h-4" />
        Strict Paper Trading • 100% Deterministic & Verifiable • Zero Real Capital At Risk
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
        Institutional-Grade <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-btc-gold via-amber-400 to-yellow-200">
          Bitcoin Market Intelligence
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
        A high-performance quantitative pipeline unifying pure TypeScript technical analysis, Bitcoin mempool dynamics,
        Hyperliquid whale tracking, derivatives liquidity, and TypeSafe AI reasoning into verifiable paper trading signals.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link
          href="/dashboard"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-btc-gold to-amber-500 hover:from-amber-400 hover:to-btc-gold text-black font-bold text-base transition-all shadow-xl shadow-btc-gold/25 hover:shadow-btc-gold/40 hover:-translate-y-0.5"
        >
          <Activity className="w-5 h-5 text-black" />
          <span>Open Live Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <a
          href="#features"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-zinc-800 bg-surface-50/70 hover:bg-surface-100 text-zinc-300 hover:text-white font-medium text-sm transition-all"
        >
          <span>Explore Features</span>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </a>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto">
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-surface-50/40 text-left">
          <div className="text-2xl font-extrabold text-btc-gold font-mono">Multi-Factor</div>
          <div className="text-xs text-zinc-300 font-semibold mt-0.5">Signal Confluence</div>
          <div className="text-[11px] text-zinc-500 mt-1">TA • On-Chain • Macro</div>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-surface-50/40 text-left">
          <div className="text-2xl font-extrabold text-signal-long font-mono">5 MTAs</div>
          <div className="text-xs text-zinc-300 font-semibold mt-0.5">Multi-Timeframe Engine</div>
          <div className="text-[11px] text-zinc-500 mt-1">5m • 15m • 1h • 4h • 1D</div>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-surface-50/40 text-left">
          <div className="text-2xl font-extrabold text-blue-400 font-mono">Real-Time</div>
          <div className="text-xs text-zinc-300 font-semibold mt-0.5">Live Data Ingestion</div>
          <div className="text-[11px] text-zinc-500 mt-1">Binance • Mempool • Yahoo</div>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-surface-50/40 text-left">
          <div className="text-2xl font-extrabold text-amber-300 font-mono">Deterministic</div>
          <div className="text-xs text-zinc-300 font-semibold mt-0.5">Paper Trading Only</div>
          <div className="text-[11px] text-zinc-500 mt-1">Simulated slippage & fees</div>
        </div>
      </div>
    </section>
  );
}
