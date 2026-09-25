import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-900 text-zinc-300">
      <Loader2 className="w-10 h-10 animate-spin text-btc-gold mb-4" />
      <div className="text-base font-semibold text-white">Loading BTC Intelligence Pipeline...</div>
      <div className="text-xs text-zinc-500 mt-1">Ingesting market, indicators, Jev, and network state</div>
    </div>
  );
}
