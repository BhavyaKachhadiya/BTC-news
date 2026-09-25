"use client";

import React from "react";
import { Terminal } from "lucide-react";
import type { TerminalView } from "../types/landing.types";
import { SignalTerminalView } from "./terminal/SignalTerminalView";
import { TimeframesTerminalView } from "./terminal/TimeframesTerminalView";
import { WhaleTerminalView } from "./terminal/WhaleTerminalView";
import { MacroTerminalView } from "./terminal/MacroTerminalView";
import { JevTerminalView } from "./terminal/JevTerminalView";

interface TerminalPreviewProps {
  activeTab: TerminalView;
  setActiveTab: (tab: TerminalView) => void;
}

export function TerminalPreview({ activeTab, setActiveTab }: TerminalPreviewProps) {
  const tabs: { id: TerminalView; label: string }[] = [
    { id: "signal", label: "Multi-Factor Signal" },
    { id: "timeframes", label: "Timeframe Alignment" },
    { id: "whale", label: "Whale & Flows" },
    { id: "macro", label: "Macro & Calendar" },
    { id: "jev", label: "Jev AI Reasoning" },
  ];

  return (
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
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-btc-gold text-black shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Screen Body */}
        <div className="p-6 sm:p-8 min-h-[380px] bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
          {activeTab === "signal" && <SignalTerminalView />}
          {activeTab === "timeframes" && <TimeframesTerminalView />}
          {activeTab === "whale" && <WhaleTerminalView />}
          {activeTab === "macro" && <MacroTerminalView />}
          {activeTab === "jev" && <JevTerminalView />}
        </div>
      </div>
    </section>
  );
}
