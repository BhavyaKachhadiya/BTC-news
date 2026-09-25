"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  LineChart,
  Activity,
  TrendingUp,
  TrendingDown,
  Layers,
  Globe,
  Bell,
  Sliders,
  Database,
  Zap,
  CheckCircle2,
  BarChart3,
  Terminal,
  Volume2,
  Calendar,
  Eye,
  RefreshCw,
  Coins,
  History,
  Sparkles,
  Gauge,
  ChevronRight,
  Play,
  RotateCcw,
} from "lucide-react";
import { playAlertChime } from "@/features/alerts/utils/browser-notification";

type TerminalView = "signal" | "timeframes" | "whale" | "macro" | "jev";

interface FeatureCard {
  id: number;
  title: string;
  category: string;
  desc: string;
  highlight: string;
}

const ALL_FEATURES: FeatureCard[] = [
  { id: 1, category: "Market", title: "Real-Time BTC Market Data", desc: "Live price, 24h change, 24h volume, market cap, and candle streams directly from Binance.", highlight: "Binance WebSocket & REST" },
  { id: 2, category: "Market", title: "Multi-Timeframe Engine", desc: "Independent 5m, 15m, 1h, 4h, and 1D analytics with higher-timeframe alignment scoring.", highlight: "5 Timeframes (5m to 1D)" },
  { id: 3, category: "On-Chain", title: "Bitcoin Mempool Intelligence", desc: "Live pending transactions, mempool memory size, sat/vB fees, block height, and congestion spikes.", highlight: "Mempool.space API" },
  { id: 4, category: "On-Chain", title: "Whale Radar & Exchange Flows", desc: ">10 BTC transfers, Hyperliquid top-20 whale positioning, and exchange reserve inflow/outflow deltas.", highlight: "Hyperliquid & On-Chain" },
  { id: 5, category: "Macro", title: "Macro Liquidity & FOMC Calendar", desc: "Real-time DXY, US 2Y/10Y Treasury yields, S&P 500, Nasdaq, Gold, plus automated FOMC/CPI schedule.", highlight: "Yahoo Finance & Calendar" },
  { id: 6, category: "News", title: "Real-Time News", desc: "Continuous CryptoPanic sentiment ingestion with deduplication and source verification.", highlight: "CryptoPanic Live" },
  { id: 7, category: "Signals", title: "Multi-Factor Signal Generator", desc: "Synthesis of TA, mempool, derivatives, and macro into STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL.", highlight: "0 to 100 Confidence" },
  { id: 8, category: "Alerts", title: "Web Notification Engine", desc: "Browser native push notifications, in-app notification center, and synthesized Web Audio chime.", highlight: "Web Only • Zero Telegram" },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TerminalView>("signal");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [chimePlayed, setChimePlayed] = useState(false);

  const categories = ["All", "Market", "On-Chain", "Macro", "News", "Signals", "Alerts"];

  const filteredFeatures = selectedCategory === "All"
    ? ALL_FEATURES
    : ALL_FEATURES.filter((f) => f.category === selectedCategory);

  const handleTestChime = () => {
    playAlertChime();
    setChimePlayed(true);
    setTimeout(() => setChimePlayed(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 selection:bg-btc-gold/20 selection:text-btc-gold relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-btc-gold/10 via-amber-500/5 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] -left-60 w-[600px] h-[600px] bg-blue-600/5 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-[1400px] -right-60 w-[600px] h-[600px] bg-signal-long/5 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.25] pointer-events-none -z-10" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#060608]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-btc-gold to-amber-600 flex items-center justify-center shadow-lg shadow-btc-gold/20">
              <span className="font-extrabold text-black text-lg">₿</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">BTC Signal Engine</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">v1.0-prod</span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">Quantitative Bitcoin Intelligence & Paper Terminal</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#features" className="hover:text-btc-gold transition-colors">Features</a>
            <a href="#terminal-preview" className="hover:text-btc-gold transition-colors">Live Preview</a>
            <a href="#alerts-telemetry" className="hover:text-btc-gold transition-colors">Alert Engine</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestChime}
              title="Test real-time Web Audio chime (no external audio assets)"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-surface-50 text-xs text-zinc-300 hover:text-btc-gold hover:border-zinc-700 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-btc-gold" />
              <span>{chimePlayed ? "Chime Fired!" : "Test Audio Chime"}</span>
            </button>
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

      {/* Hero Section */}
      <section className="pt-16 pb-14 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-btc-gold/30 bg-btc-gold/10 text-btc-gold text-xs font-semibold tracking-wide uppercase shadow-sm shadow-btc-gold/10 animate-fade-in">
          <ShieldCheck className="w-4 h-4" />
          Strict Paper Trading • 100% Deterministic & Verifiable • Zero Real Capital At Risk
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
          Institutional-Grade <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-btc-gold via-amber-400 to-yellow-200">
            Bitcoin Market Intelligence
          </span>
        </h1>

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

      {/* Interactive Terminal Mockup Section */}
      <section id="terminal-preview" className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            Interactive Workspace Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Live Intelligence Terminal</h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Switch between modules below to preview how our deterministic pipelines and TypeSafe AI model market regimes in real-time.
          </p>
        </div>

        {/* Terminal Window Container */}
        <div className="rounded-2xl border border-zinc-800 bg-[#0a0a0e] shadow-2xl overflow-hidden">
          {/* Terminal Window Top Bar */}
          <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs font-mono text-zinc-400">btc-signal-engine: live-market-pipeline</span>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab("signal")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === "signal" ? "bg-btc-gold text-black shadow-sm font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Multi-Factor Signal
              </button>
              <button
                onClick={() => setActiveTab("timeframes")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === "timeframes" ? "bg-btc-gold text-black shadow-sm font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Timeframe Alignment
              </button>
              <button
                onClick={() => setActiveTab("whale")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === "whale" ? "bg-btc-gold text-black shadow-sm font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Whale & Flows
              </button>
              <button
                onClick={() => setActiveTab("macro")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === "macro" ? "bg-btc-gold text-black shadow-sm font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Macro & Calendar
              </button>
              <button
                onClick={() => setActiveTab("jev")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === "jev" ? "bg-btc-gold text-black shadow-sm font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Jev AI Reasoning
              </button>
            </div>
          </div>

          {/* Terminal Screen Body */}
          <div className="p-6 sm:p-8 min-h-[380px] bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
            {activeTab === "signal" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                <div className="p-5 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <span>ENGINE RECOMMENDATION</span>
                    <span className="text-signal-long font-semibold">99.8% CERTAINTY</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-extrabold text-signal-long tracking-tight">STRONG BUY</div>
                    <div className="text-xs text-zinc-400">Target Range: $65,800 - $66,400</div>
                  </div>
                  <div className="pt-2 border-t border-zinc-800/80 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Signal Confidence:</span>
                      <span className="text-white font-mono font-bold">88 / 100</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-signal-long h-full w-[88%]" />
                    </div>
                    <div className="flex justify-between text-zinc-400 pt-1">
                      <span>Market Regime:</span>
                      <span className="text-amber-400 font-semibold">Bullish Trend Continuation</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3">
                  <span className="text-xs text-zinc-400 font-mono">DETERMINISTIC CONFLUENCE</span>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between p-2 rounded bg-zinc-900/80 border border-zinc-800">
                      <span className="text-zinc-400">RSI (14-period):</span>
                      <span className="text-zinc-200 font-bold">54.6 (Neutral-Bull)</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-zinc-900/80 border border-zinc-800">
                      <span className="text-zinc-400">EMA Cross (20/50):</span>
                      <span className="text-signal-long font-bold">Golden Cross Active</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-zinc-900/80 border border-zinc-800">
                      <span className="text-zinc-400">ATR Volatility:</span>
                      <span className="text-zinc-200 font-bold">$1,240 (Expansion)</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-zinc-900/80 border border-zinc-800">
                      <span className="text-zinc-400">Mempool Fees:</span>
                      <span className="text-blue-400 font-bold">14 sat/vB (Low Congestion)</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-4">
                  <span className="text-xs text-zinc-400 font-mono">EXECUTION PLAN (PAPER TRADING)</span>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Simulated Entry:</span>
                      <span className="text-white font-mono font-semibold">$64,320.00</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Stop Loss (ATR 1.5x):</span>
                      <span className="text-signal-short font-mono font-semibold">$62,460.00 (-2.8%)</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Take Profit (Tier 1):</span>
                      <span className="text-signal-long font-mono font-semibold">$66,800.00 (+3.8%)</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Take Profit (Tier 2):</span>
                      <span className="text-signal-long font-mono font-semibold">$68,200.00 (+6.0%)</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-800 flex justify-between text-zinc-400">
                      <span>Risk / Reward Ratio:</span>
                      <span className="text-amber-400 font-bold">1 : 2.14</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "timeframes" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>TIME-SCALE INDEPENDENCE WITH HIGHER-TIMEFRAME VETO</span>
                  <span className="text-signal-long font-semibold">Alignment Score: 85% Confluence</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {[
                    { tf: "5m", bias: "Bullish", rsi: 58.2, ema: "Above", conf: "82%" },
                    { tf: "15m", bias: "Bullish", rsi: 61.4, ema: "Above", conf: "88%" },
                    { tf: "1h", bias: "Neutral", rsi: 51.1, ema: "Ranging", conf: "64%" },
                    { tf: "4h", bias: "Bullish", rsi: 56.8, ema: "Above", conf: "90%" },
                    { tf: "1D", bias: "Strong Bull", rsi: 64.0, ema: "Above", conf: "94%" },
                  ].map((item) => (
                    <div key={item.tf} className="p-4 rounded-xl border border-zinc-800 bg-surface-50/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-btc-gold">{item.tf}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">{item.conf}</span>
                      </div>
                      <div className="text-base font-bold text-signal-long">{item.bias}</div>
                      <div className="text-[11px] text-zinc-400 space-y-0.5 font-mono">
                        <div>RSI: {item.rsi}</div>
                        <div>EMA20: {item.ema}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-btc-gold flex-shrink-0" />
                  <span>Rule: Scalp signals on 5m and 15m are filtered out if the 4h and 1D macro indicators point in the opposite direction.</span>
                </div>
              </div>
            )}

            {activeTab === "whale" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
                <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <Activity className="w-4 h-4 text-btc-gold" />
                    <span>EXCHANGE RESERVE FLOWS</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">24h Inflows:</span>
                      <span className="text-red-400 font-mono font-semibold">1,240 BTC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">24h Outflows:</span>
                      <span className="text-emerald-400 font-mono font-semibold">2,890 BTC</span>
                    </div>
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex justify-between">
                      <span>Net Exchange Delta:</span>
                      <span className="font-mono">-1,650 BTC (Outflow)</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">Persistent net outflows indicate institutional spot accumulation off exchanges into cold storage.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <Coins className="w-4 h-4 text-blue-400" />
                    <span>HYPERLIQUID TOP-20 WHALES</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Long / Short Exposure:</span>
                      <span className="text-signal-long font-mono font-bold">68% Long / 32% Short</span>
                    </div>
                    <div className="w-full bg-red-500/40 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-signal-long h-full w-[68%]" />
                    </div>
                    <div className="flex justify-between text-zinc-400 pt-1">
                      <span>Combined Whale PnL:</span>
                      <span className="text-signal-long font-mono font-semibold">+$34,280,000</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">Smart money positioning heavily skews net long on perpetual swaps with positive unearned carry.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>LARGE MEMPOOL TRANSFERS</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex justify-between">
                      <span className="text-zinc-400">Tx 8f19...c3b0</span>
                      <span className="text-amber-400 font-bold">248.5 BTC ($15.9M)</span>
                    </div>
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex justify-between">
                      <span className="text-zinc-400">Tx 3a0c...91e2</span>
                      <span className="text-amber-400 font-bold">115.0 BTC ($7.3M)</span>
                    </div>
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex justify-between">
                      <span className="text-zinc-400">Tx e742...10aa</span>
                      <span className="text-amber-400 font-bold">84.2 BTC ($5.4M)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "macro" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3">
                  <span className="text-xs text-zinc-400 font-mono">GLOBAL LIQUIDITY CORRELATION</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                      <div className="text-zinc-400 text-[10px]">US DOLLAR (DXY)</div>
                      <div className="text-base font-bold text-white mt-1">104.25</div>
                      <div className="text-emerald-400 text-[11px]">-0.32% (Tailwind)</div>
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                      <div className="text-zinc-400 text-[10px]">10Y US YIELD</div>
                      <div className="text-base font-bold text-white mt-1">4.28%</div>
                      <div className="text-zinc-400 text-[11px]">+0.01 bps (Flat)</div>
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                      <div className="text-zinc-400 text-[10px]">S&P 500</div>
                      <div className="text-base font-bold text-white mt-1">5,980.50</div>
                      <div className="text-emerald-400 text-[11px]">+0.68% (Risk-On)</div>
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                      <div className="text-zinc-400 text-[10px]">GOLD (GC=F)</div>
                      <div className="text-base font-bold text-white mt-1">$2,740.20</div>
                      <div className="text-emerald-400 text-[11px]">+0.45% (Safe Haven)</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-btc-gold" /> UPCOMING FOMC & MACRO SCHEDULE</span>
                    <span className="text-amber-400">Automated Feed</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200">FOMC Interest Rate Decision</div>
                        <div className="text-[10px] text-zinc-500">Federal Reserve Policy Announcement</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-[10px]">HIGH IMPACT</span>
                    </div>
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200">Consumer Price Index (CPI MoM/YoY)</div>
                        <div className="text-[10px] text-zinc-500">Bureau of Labor Statistics</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-[10px]">HIGH IMPACT</span>
                    </div>
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200">Non-Farm Payrolls (NFP)</div>
                        <div className="text-[10px] text-zinc-500">US Labor Employment Data</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px]">MED IMPACT</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "jev" && (
              <div className="p-5 rounded-xl border border-zinc-800 bg-surface-50/50 space-y-3 font-mono text-xs animate-fade-in">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-amber-400 flex items-center gap-1.5 font-bold">
                    <Cpu className="w-4 h-4 text-btc-gold" />
                    TYPESAFE JEV AI REASONING AUDIT (GEMINI 2.5 FLASH)
                  </span>
                  <span className="text-zinc-500">Execution Time: 342ms</span>
                </div>
                <div className="p-3 rounded bg-zinc-950 border border-zinc-800/80 space-y-2 text-zinc-300 leading-relaxed font-sans text-xs">
                  <p>
                    <strong className="text-white">Synthesized Thesis:</strong> Bitcoin is breaking out of a 4-hour ascending compression zone with strong volume confirmation. 
                    Derivatives funding rates remain calm at +0.008%, indicating organic spot accumulation rather than over-leveraged retail chase.
                  </p>
                  <p>
                    <strong className="text-white">Risk Counter-Argument:</strong> DXY consolidation around 104.25 could create temporary dollar strength headwinds if macro yields tick up ahead of upcoming FOMC dates.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-signal-long/10 text-signal-long border border-signal-long/20">Bias: BULLISH_EXPANSION</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Regime: LOW_VOL_ACCUMULATION</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">Fallback Guard: VERIFIED</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Matrix Showcase (8 Core Features) */}
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
                onClick={() => setSelectedCategory(cat)}
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

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeatures.map((feat) => (
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



      {/* Alert Engine & Telemetry Feature Callout */}
      <section id="alerts-telemetry" className="py-14 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="p-8 rounded-2xl border border-zinc-800 bg-gradient-to-r from-surface-50 via-zinc-900 to-surface-50 relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-btc-gold/30 bg-btc-gold/10 text-btc-gold text-xs font-semibold">
              <Bell className="w-3.5 h-3.5" />
              Feature #22 & #23 Highlights
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Native Web Alerts & Multi-Provider Health Telemetry
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Never miss a critical market regime breakout. We engineered an in-browser push alert notification center 
              with synthesized <strong>Web Audio dual-tone chimes</strong> (no Telegram bots required, zero static asset dependencies). 
              Our unified health watcher tracks uptime, latency, and automated fallback modes across all 5 data providers.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleTestChime}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors border border-zinc-700"
              >
                <Volume2 className="w-4 h-4 text-btc-gold" />
                <span>{chimePlayed ? "Chime Played!" : "Listen to Dual-Tone Audio Alert"}</span>
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-btc-gold text-black font-semibold text-xs transition-colors hover:bg-amber-400"
              >
                <span>View Alert Notification Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
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

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-black/60 py-8 px-4 sm:px-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">BTC Signal Engine</span>
            <span>•</span>
            <span>Pure TypeScript & Next.js 15</span>
            <span>•</span>
          </div>
          <div className="text-zinc-500 text-center sm:text-right">
            Strict Paper Trading Only. No real funds execution or financial advice.
          </div>
        </div>
      </footer>
    </div>
  );
}
