"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Zap,
  Clock,
  ShieldCheck,
} from "lucide-react";
import type { SystemHealthSummary, ProviderHealthDetail } from "../types/health.types";

export function HealthStatusWidget() {
  const [health, setHealth] = useState<SystemHealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health");
      const json = await res.json();
      if (json.success && json.data) {
        setHealth(json.data);
      } else {
        setError(json.error ?? "Failed to fetch provider health status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000); // 30s auto refresh
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getStatusBadge = (status: ProviderHealthDetail["status"]) => {
    switch (status) {
      case "healthy":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Operational
          </span>
        );
      case "degraded":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Degraded / Slow
          </span>
        );
      case "down":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Offline
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
              Provider Freshness & System Health
            </h2>
            <p className="text-xs text-zinc-500">Live latency & telemetry status across all external data feeds</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {health && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">System:</span>
              {getStatusBadge(health.overallStatus)}
            </div>
          )}
          <button
            onClick={fetchHealth}
            disabled={isLoading}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition disabled:opacity-50"
            title="Refresh Health Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {health?.providers.map((p) => (
            <div
              key={p.id}
              className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-zinc-200">{p.name}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{p.category}</div>
                </div>
                {getStatusBadge(p.status)}
              </div>

              {p.message && (
                <div className="text-[11px] font-mono text-zinc-400 truncate bg-zinc-950/40 px-2 py-1 rounded border border-zinc-800/50">
                  {p.message}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1 border-t border-zinc-800/50">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-btc-gold" />
                  {p.latencyMs} ms
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {p.isStale ? "Stale" : "Live"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
