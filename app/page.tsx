import Link from "next/link";
import { ArrowRight, ShieldCheck, Cpu, LineChart, Activity } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-surface-900 via-surface-800 to-black">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-btc-gold/30 bg-btc-gold/10 text-btc-gold text-xs font-semibold tracking-wide uppercase">
          <ShieldCheck className="w-4 h-4" />
          Strict Paper Trading Only • Zero Live Orders
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
          BTC Signal Engine
        </h1>

        <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Deterministic technical indicators combined with TypeSafe AI / Jev interpretation for quantitative Bitcoin market research.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50">
            <Cpu className="w-5 h-5 text-btc-gold mb-2" />
            <h3 className="font-semibold text-zinc-200">Jev Interpretation</h3>
            <p className="text-xs text-zinc-400 mt-1">Interprets ambiguous context and market regimes with TypeSafe AI.</p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50">
            <LineChart className="w-5 h-5 text-signal-long mb-2" />
            <h3 className="font-semibold text-zinc-200">Deterministic Engine</h3>
            <p className="text-xs text-zinc-400 mt-1">Pure TypeScript indicators (RSI, EMA, ATR) and rule-based decisions.</p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50">
            <Activity className="w-5 h-5 text-blue-400 mb-2" />
            <h3 className="font-semibold text-zinc-200">Paper Trading</h3>
            <p className="text-xs text-zinc-400 mt-1">Automated simulated execution tracking PnL and 1h/4h/24h outcomes.</p>
          </div>
        </div>

        <div className="pt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-btc-gold hover:bg-btc-accent text-black font-semibold transition-colors shadow-lg shadow-btc-gold/20"
          >
            Open Intelligence Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
