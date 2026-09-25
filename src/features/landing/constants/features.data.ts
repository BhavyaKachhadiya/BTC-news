import type { FeatureCard } from "../types/landing.types";

export const FEATURE_CATEGORIES = [
  "All",
  "Market",
  "On-Chain",
  "Macro",
  "News",
  "Signals",
  "Alerts",
] as const;

export const ALL_FEATURES: readonly FeatureCard[] = [
  {
    id: 1,
    category: "Market",
    title: "Real-Time BTC Market Data",
    desc: "Live price, 24h change, 24h volume, market cap, and candle streams directly from Binance.",
    highlight: "Binance WebSocket & REST",
  },
  {
    id: 2,
    category: "Market",
    title: "Multi-Timeframe Engine",
    desc: "Independent 5m, 15m, 1h, 4h, and 1D analytics with higher-timeframe alignment scoring.",
    highlight: "5 Timeframes (5m to 1D)",
  },
  {
    id: 3,
    category: "On-Chain",
    title: "Bitcoin Mempool Intelligence",
    desc: "Live pending transactions, mempool memory size, sat/vB fees, block height, and congestion spikes.",
    highlight: "Mempool.space API",
  },
  {
    id: 4,
    category: "On-Chain",
    title: "Whale Radar & Exchange Flows",
    desc: ">10 BTC transfers, Hyperliquid top-20 whale positioning, and exchange reserve inflow/outflow deltas.",
    highlight: "Hyperliquid & On-Chain",
  },
  {
    id: 5,
    category: "Macro",
    title: "Macro Liquidity & FOMC Calendar",
    desc: "Real-time DXY, US 2Y/10Y Treasury yields, S&P 500, Nasdaq, Gold, plus automated FOMC/CPI schedule.",
    highlight: "Yahoo Finance & Calendar",
  },
  {
    id: 6,
    category: "News",
    title: "Real-Time News",
    desc: "Continuous CryptoPanic sentiment ingestion with deduplication and source verification.",
    highlight: "CryptoPanic Live",
  },
  {
    id: 7,
    category: "Signals",
    title: "Multi-Factor Signal Generator",
    desc: "Synthesis of TA, mempool, derivatives, and macro into STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL.",
    highlight: "0 to 100 Confidence",
  },
  {
    id: 8,
    category: "Alerts",
    title: "Web Notification Engine",
    desc: "Browser native push notifications, in-app notification center, and synthesized Web Audio chime.",
    highlight: "Web Only • Zero Telegram",
  },
];
