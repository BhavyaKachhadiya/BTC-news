"use client";

import React from "react";
import Link from "next/link";
import { Terminal, ArrowRight } from "lucide-react";

export function LandingCta() {
  return (
    <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-6">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
        Ready to inspect the Bitcoin market in real time?
      </h2>
      <p className="text-sm text-zinc-400 max-w-lg mx-auto">
        Launch our live dashboard to view multi-timeframe candle charts, whale orders, funding rate spikes, and simulated paper execution.
      </p>
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-btc-gold to-amber-500 hover:from-amber-400 hover:to-btc-gold text-black font-extrabold text-base transition-all shadow-xl shadow-btc-gold/25 hover:shadow-btc-gold/40 hover:scale-105"
        >
          <Terminal className="w-5 h-5 text-black" />
          <span>Launch Live Intelligence Terminal</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
