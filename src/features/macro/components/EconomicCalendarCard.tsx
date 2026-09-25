"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  AlertTriangle,
  Clock,
  Landmark,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
} from "lucide-react";
import type { EconomicCalendarSummary, EconomicEvent } from "../types/calendar.types";

export function EconomicCalendarCard() {
  const [calendar, setCalendar] = useState<EconomicCalendarSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/macro/calendar")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setCalendar(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const getImpactBadge = (impact: EconomicEvent["impact"]) => {
    switch (impact) {
      case "HIGH":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            HIGH IMPACT
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            MEDIUM
          </span>
        );
      case "LOW":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            LOW
          </span>
        );
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
              Macro Economic Calendar &amp; Catalysts
            </h2>
            <p className="text-xs text-zinc-500">Upcoming FOMC, CPI, PPI, and Nonfarm Payroll prints</p>
          </div>
        </div>

        {calendar?.daysUntilNextFomc !== null && calendar?.daysUntilNextFomc !== undefined && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Landmark className="w-4 h-4 text-purple-400" />
            <span>FOMC in {calendar.daysUntilNextFomc} days</span>
          </div>
        )}
      </div>

      {/* Next High Impact Catalyst Banner */}
      {calendar?.nextHighImpactEvent && (
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Next Major Market Catalyst:
              </span>
              <span className="text-xs font-bold text-white">
                {calendar.nextHighImpactEvent.name}
              </span>
            </div>
            {getImpactBadge(calendar.nextHighImpactEvent.impact)}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-btc-gold" />
              {formatDate(calendar.nextHighImpactEvent.scheduledAt)}
            </span>
            {calendar.nextHighImpactEvent.consensus && (
              <span>
                Consensus: <strong className="text-white">{calendar.nextHighImpactEvent.consensus}</strong>
              </span>
            )}
            {calendar.nextHighImpactEvent.previous && (
              <span>
                Previous: <strong className="text-zinc-400">{calendar.nextHighImpactEvent.previous}</strong>
              </span>
            )}
          </div>

          <div className="text-[11px] text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-zinc-200">BTC Implication: </strong>
              {calendar.nextHighImpactEvent.btcImplication}
            </span>
          </div>
        </div>
      )}

      {/* Upcoming Events Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Upcoming Schedule
        </h3>

        <div className="space-y-2">
          {calendar?.upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70 hover:border-zinc-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">{event.name}</span>
                  {getImpactBadge(event.impact)}
                </div>
                <div className="text-[11px] text-zinc-500">{event.btcImplication}</div>
              </div>

              <div className="flex items-center gap-4 shrink-0 font-mono text-[11px] text-zinc-400">
                <span className="text-zinc-300">{formatDate(event.scheduledAt)}</span>
                {event.consensus && (
                  <span className="hidden sm:inline bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    Est: {event.consensus}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
