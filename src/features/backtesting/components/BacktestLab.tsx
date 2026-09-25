"use client";

import React, { useState, useMemo, useId, useEffect } from "react";
import {
  Sliders,
  Play,
  RotateCw,
  TrendingUp,
  Percent,
  ShieldAlert,
  Award,
  Layers,
  Sparkles,
  BarChart3,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Bookmark,
  Save,
  Trash2,
  FolderPlus,
} from "lucide-react";
import {
  STRATEGY_PRESETS,
  DEFAULT_STRATEGY_PARAMETERS,
  type StrategyParameters,
  type StrategyPresetKey,
} from "@/features/strategy-lab/types/strategy.types";
import { parameterSweepService } from "@/features/strategy-lab/services/parameter-sweep.service";
import type { ParameterSweepResult } from "@/features/strategy-lab/types/strategy.types";
import {
  defaultIntelligenceFeatures,
  type IntelligenceFeatures,
} from "@/config/features";
import { backtestService } from "../services/backtest.service";
import {
  generateCandlesForScenario,
  MARKET_SCENARIOS,
  type MarketScenario,
} from "../data/sample-candles";
import type { BacktestResult, BacktestTrade } from "../types/backtest.types";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
} from "@/shared/utils/formatters";
import { DataReplayPlayer } from "./DataReplayPlayer";

import {
  useSavedStrategiesQuery,
  useSaveStrategyMutation,
  useDeleteStrategyMutation,
} from "@/shared/hooks/useQueries";

export function BacktestLab() {
  const gradientId = useId();
  // Strategy Preset & Parameters
  const [selectedPreset, setSelectedPreset] =
    useState<StrategyPresetKey | "custom">("trend_following");
  const [params, setParams] = useState<StrategyParameters>(
    DEFAULT_STRATEGY_PARAMETERS,
  );

  // Feature Flags
  const [features, setFeatures] = useState<IntelligenceFeatures>(
    defaultIntelligenceFeatures,
  );

  // Backtest Config
  const [initialBalance, setInitialBalance] = useState<number>(10000);
  const [feeBps, setFeeBps] = useState<number>(10);
  const [scenario, setScenario] = useState<MarketScenario>("full_cycle");

  // Mode: "single" backtest, "sweep", or "replay"
  const [activeTab, setActiveTab] = useState<"single" | "sweep" | "replay">("single");

  // Simulation State
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(
    () => {
      const candles = generateCandlesForScenario("full_cycle");
      return backtestService.runBacktest(
        {
          startDate: candles[0].timestamp,
          endDate: candles[candles.length - 1].timestamp,
          initialBalance: 10000,
          feeBps: 10,
          strategyParams: DEFAULT_STRATEGY_PARAMETERS,
          featureFlags: defaultIntelligenceFeatures,
        },
        candles,
      );
    },
  );

  const [sweepResults, setSweepResults] = useState<
    readonly ParameterSweepResult[]
  >([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(
    null,
  );

  // Saved Strategies State via React Query
  const { data: savedStrategies = [] } = useSavedStrategiesQuery();
  const saveStrategyMutation = useSaveStrategyMutation();
  const deleteStrategyMutation = useDeleteStrategyMutation();
  const [isSavingStrategy, setIsSavingStrategy] = useState<boolean>(false);
  const [newStrategyName, setNewStrategyName] = useState<string>("");
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  const handleSaveStrategy = async () => {
    if (!newStrategyName.trim()) return;
    try {
      const saved = await saveStrategyMutation.mutateAsync({
        name: newStrategyName.trim(),
        preset: selectedPreset,
        parameters: params,
        features,
      });
      if (saved) {
        setSelectedSavedId(saved.id);
        setIsSavingStrategy(false);
        setNewStrategyName("");
      }
    } catch (err) {
      console.error("Failed to save strategy", err);
    }
  };

  const handleLoadSavedStrategy = (saved: {
    id: string;
    preset: string;
    parameters: StrategyParameters;
  }) => {
    setSelectedSavedId(saved.id);
    setSelectedPreset(saved.preset as any);
    setParams(saved.parameters);
  };

  const handleDeleteSavedStrategy = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteStrategyMutation.mutateAsync(id);
      if (selectedSavedId === id) setSelectedSavedId(null);
    } catch (err) {
      console.error("Failed to delete strategy", err);
    }
  };

  // Preset Selection Handler
  const handlePresetChange = (presetKey: StrategyPresetKey) => {
    setSelectedSavedId(null);
    setSelectedPreset(presetKey);
    setParams(STRATEGY_PRESETS[presetKey].parameters);
  };

  // Parameter Slider Change Handler
  const handleParamChange = <K extends keyof StrategyParameters>(
    key: K,
    value: number,
  ) => {
    setSelectedPreset("custom");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Feature Flag Toggle Handler
  const toggleFeature = (key: keyof IntelligenceFeatures) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Run Backtest
  const runSimulation = () => {
    setIsRunning(true);
    // Use short timeout to allow React UI to render spinner smoothly
    setTimeout(() => {
      try {
        const candles = generateCandlesForScenario(scenario);
        if (activeTab === "single") {
          const result = backtestService.runBacktest(
            {
              startDate: candles[0].timestamp,
              endDate: candles[candles.length - 1].timestamp,
              initialBalance,
              feeBps,
              strategyParams: params,
              featureFlags: features,
            },
            candles,
          );
          setBacktestResult(result);
        } else {
          const sweep = parameterSweepService.runSweep(
            {
              ranges: {
                rsiLongThresholds: [
                  params.rsiLongThreshold - 5,
                  params.rsiLongThreshold,
                  params.rsiLongThreshold + 5,
                ],
                stopLossPercents: [
                  params.stopLossPercent,
                  params.stopLossPercent + 1,
                ],
                takeProfitPercents: [
                  params.takeProfitPercent,
                  params.takeProfitPercent + 2,
                ],
              },
              maxCombinations: 12,
            },
            candles,
            {
              initialBalance,
              feeBps,
              featureFlags: features,
            },
          );
          setSweepResults(sweep);
        }
      } finally {
        setIsRunning(false);
      }
    }, 50);
  };

  // SVG Chart Geometry
  const chartData = useMemo(() => {
    if (!backtestResult || backtestResult.equityCurve.length === 0) return null;
    const curve = backtestResult.equityCurve;

    const equities = curve.map((p) => p.equity);
    const minVal = Math.min(...equities, initialBalance * 0.95);
    const maxVal = Math.max(...equities, initialBalance * 1.05);
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 240;
    const padding = 20;

    const points = curve.map((pt, idx) => {
      const x = padding + (idx / (curve.length - 1 || 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        ((pt.equity - minVal) / range) * (height - padding * 2);
      return { x, y, pt };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    const areaD = `${pathD} L ${points[points.length - 1].x} ${
      height - padding
    } L ${points[0].x} ${height - padding} Z`;

    const baselineY =
      height -
      padding -
      ((initialBalance - minVal) / range) * (height - padding * 2);

    return {
      points,
      pathD,
      areaD,
      width,
      height,
      minVal,
      maxVal,
      baselineY,
      isProfitable: backtestResult.totalReturnPercent >= 0,
    };
  }, [backtestResult, initialBalance]);

  return (
    <div className="space-y-6">
      {/* Header and Mode Tabs */}
      <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-btc-gold/10 text-btc-gold border border-btc-gold/20 shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Strategy Lab & Historical Backtesting
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Zero Lookahead Bias
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Simulate deterministic signal execution across BTC price regimes
                with risk-managed orders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setActiveTab("single")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "single"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Single Simulation
            </button>
            <button
              onClick={() => setActiveTab("sweep")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "sweep"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-btc-gold" />
              Parameter Sweep Matrix
            </button>
            <button
              onClick={() => setActiveTab("replay")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "replay"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <RotateCw className="w-3.5 h-3.5 text-btc-gold" />
              Interactive Replay
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="mt-6 pt-5 border-t border-zinc-850">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Strategy Presets
            </span>
            <span className="text-[11px] text-zinc-500">
              Active:{" "}
              <strong className="text-zinc-300 capitalize">
                {selectedPreset.replace("_", " ")}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              Object.keys(STRATEGY_PRESETS) as StrategyPresetKey[]
            ).map((key) => {
              const preset = STRATEGY_PRESETS[key];
              const isSelected = selectedPreset === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePresetChange(key)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-btc-gold/10 border-btc-gold text-white shadow-md shadow-btc-gold/5"
                      : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-100">
                      {preset.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-btc-gold" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-tight">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Saved Custom Strategies & Save Modal */}
          <div className="mt-4 pt-3 border-t border-zinc-850/60">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-btc-gold" />
                <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                  Saved Custom Strategies
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                  {savedStrategies.length}
                </span>
              </div>

              {!isSavingStrategy ? (
                <button
                  onClick={() => setIsSavingStrategy(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-btc-gold" />
                  Save Current Strategy
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Strategy Name (e.g. Trend Pro 2026)"
                    value={newStrategyName}
                    onChange={(e) => setNewStrategyName(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-btc-gold w-56"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveStrategy}
                    disabled={!newStrategyName.trim()}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-btc-gold text-zinc-950 hover:bg-btc-gold/90 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3 h-3" /> Save
                  </button>
                  <button
                    onClick={() => {
                      setIsSavingStrategy(false);
                      setNewStrategyName("");
                    }}
                    className="px-2 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {savedStrategies.length === 0 ? (
              <p className="text-[11px] text-zinc-500 italic">
                No custom strategies saved yet. Tune the parameters below and click &quot;Save Current Strategy&quot; to persist them.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {savedStrategies.map((s) => {
                  const isSelected = selectedSavedId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleLoadSavedStrategy(s)}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? "bg-purple-500/15 border-purple-500/40 text-purple-300 font-semibold shadow-sm"
                          : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      <Bookmark className={`w-3 h-3 ${isSelected ? "text-purple-400" : "text-zinc-500"}`} />
                      <span>{s.name}</span>
                      <button
                        onClick={(e) => handleDeleteSavedStrategy(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-rose-400 transition"
                        title="Delete saved strategy"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Strategy Parameters Sliders */}
        <div className="mt-6 pt-5 border-t border-zinc-850">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Deterministic Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* RSI Long Threshold */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">RSI Long Entry Threshold</span>
                <span className="font-mono font-bold text-emerald-400">
                  ≤ {params.rsiLongThreshold}
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={60}
                step={1}
                value={params.rsiLongThreshold}
                onChange={(e) =>
                  handleParamChange("rsiLongThreshold", Number(e.target.value))
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>20 (Oversold)</span>
                <span>60 (Momentum)</span>
              </div>
            </div>

            {/* RSI Short Threshold */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">RSI Short Entry Threshold</span>
                <span className="font-mono font-bold text-rose-400">
                  ≥ {params.rsiShortThreshold}
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={85}
                step={1}
                value={params.rsiShortThreshold}
                onChange={(e) =>
                  handleParamChange("rsiShortThreshold", Number(e.target.value))
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>40 (Weak)</span>
                <span>85 (Overbought)</span>
              </div>
            </div>

            {/* Fast EMA Period */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Fast EMA Lookback</span>
                <span className="font-mono font-bold text-cyan-400">
                  {params.emaFastPeriod} bars
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={params.emaFastPeriod}
                onChange={(e) =>
                  handleParamChange("emaFastPeriod", Number(e.target.value))
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>5 bars</span>
                <span>30 bars</span>
              </div>
            </div>

            {/* Slow EMA Period */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Slow EMA Lookback</span>
                <span className="font-mono font-bold text-blue-400">
                  {params.emaSlowPeriod} bars
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                step={2}
                value={params.emaSlowPeriod}
                onChange={(e) =>
                  handleParamChange("emaSlowPeriod", Number(e.target.value))
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>20 bars</span>
                <span>100 bars</span>
              </div>
            </div>

            {/* Stop Loss Percent */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Stop Loss</span>
                <span className="font-mono font-bold text-rose-400">
                  {params.stopLossPercent.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={8.0}
                step={0.5}
                value={params.stopLossPercent}
                onChange={(e) =>
                  handleParamChange("stopLossPercent", Number(e.target.value))
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>0.5% (Tight)</span>
                <span>8.0% (Wide)</span>
              </div>
            </div>

            {/* Take Profit Percent */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Take Profit</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{params.takeProfitPercent.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={1.0}
                max={15.0}
                step={0.5}
                value={params.takeProfitPercent}
                onChange={(e) =>
                  handleParamChange("takeProfitPercent", Number(e.target.value))
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>1.0% (Scalp)</span>
                <span>15.0% (Runner)</span>
              </div>
            </div>

            {/* Min Confidence */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Minimum Confidence Threshold</span>
                <span className="font-mono font-bold text-btc-gold">
                  {params.minConfidence}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={90}
                step={5}
                value={params.minConfidence}
                onChange={(e) =>
                  handleParamChange("minConfidence", Number(e.target.value))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>50% (Permissive)</span>
                <span>90% (Strict)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Flags & Market Regime Selectors */}
        <div className="mt-6 pt-5 border-t border-zinc-850 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intelligence Feature Flags */}
          <div className="space-y-3">
            <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-btc-gold" />
              Intelligence Feature Flags
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  ["multiTimeframe", "Multi-Timeframe"],
                  ["whaleIntelligence", "Whale Volume"],
                  ["derivatives", "Derivatives"],
                  ["macro", "Macro Slope"],
                  ["newsSentiment", "News Sentiment"],
                ] as const
              ).map(([key, label]) => {
                const active = features[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleFeature(key)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-between transition-colors cursor-pointer ${
                      active
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        active ? "bg-cyan-400 shadow-sm" : "bg-zinc-700"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Market Scenario & Capital Setup */}
          <div className="space-y-3">
            <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              Historical Market Scenario & Capital
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Historical Regime Dataset
                </label>
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value as MarketScenario)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-btc-gold cursor-pointer"
                >
                  {(
                    Object.keys(MARKET_SCENARIOS) as MarketScenario[]
                  ).map((scKey) => (
                    <option key={scKey} value={scKey}>
                      {MARKET_SCENARIOS[scKey].name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Initial Balance ($)
                  </label>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-btc-gold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Fee (bps)
                  </label>
                  <input
                    type="number"
                    value={feeBps}
                    onChange={(e) => setFeeBps(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-btc-gold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-5 border-t border-zinc-850 flex items-center justify-end">
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-btc-gold hover:bg-btc-accent text-black font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-btc-gold/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isRunning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Simulating Historical Candles...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                {activeTab === "single"
                  ? "Run Backtest Simulation"
                  : "Execute Parameter Sweep"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Single Backtest Mode: KPI Grid + Chart + Trades Table */}
      {activeTab === "single" && backtestResult && (
        <div className="space-y-6">
          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Win Rate */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-surface-100/60">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Win Rate</span>
                <Percent className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <div className="text-xl font-bold text-zinc-100">
                {backtestResult.winRate}%
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                {backtestResult.winningTrades}W / {backtestResult.losingTrades}L
              </div>
            </div>

            {/* Total Return */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-surface-100/60">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Total Return</span>
                <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <div
                className={`text-xl font-bold ${
                  backtestResult.totalReturnPercent >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {formatPercent(backtestResult.totalReturnPercent)}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                {formatCurrency(
                  backtestResult.equityCurve[
                    backtestResult.equityCurve.length - 1
                  ]?.equity ?? initialBalance,
                )}
              </div>
            </div>

            {/* Max Drawdown */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-surface-100/60">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Max Drawdown</span>
                <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <div className="text-xl font-bold text-rose-400">
                -{backtestResult.maxDrawdownPercent}%
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">Peak-to-Trough</div>
            </div>

            {/* Sharpe Ratio */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-surface-100/60">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Sharpe Ratio</span>
                <Award className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <div className="text-xl font-bold text-cyan-400">
                {backtestResult.sharpeRatio.toFixed(2)}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">Risk Adjusted</div>
            </div>

            {/* Profit Factor */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-surface-100/60">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Profit Factor</span>
                <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <div className="text-xl font-bold text-btc-gold">
                {Number.isFinite(backtestResult.profitFactor)
                  ? backtestResult.profitFactor.toFixed(2)
                  : "∞"}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">Gross Win/Loss</div>
            </div>

            {/* Total Trades */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-surface-100/60">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Total Trades</span>
                <Layers className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <div className="text-xl font-bold text-zinc-200">
                {backtestResult.totalTrades}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">Executions</div>
            </div>
          </div>

          {/* Equity Curve SVG Chart */}
          <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-850">
              <div>
                <h3 className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
                  Portfolio Equity Curve
                </h3>
                <p className="text-xs text-zinc-500">
                  Historical mark-to-market performance with fee modeling
                </p>
              </div>

              {chartData && (
                <div className="text-right">
                  <div className="text-xs text-zinc-400">
                    Hovered Equity:{" "}
                    <span className="font-bold text-zinc-100">
                      {hoveredPointIndex !== null && chartData.points[hoveredPointIndex]
                        ? formatCurrency(
                            chartData.points[hoveredPointIndex].pt.equity,
                          )
                        : formatCurrency(
                            backtestResult.equityCurve[
                              backtestResult.equityCurve.length - 1
                            ]?.equity ?? initialBalance,
                          )}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Baseline: {formatCurrency(initialBalance)}
                  </div>
                </div>
              )}
            </div>

            {chartData ? (
              <div className="mt-4 relative overflow-hidden">
                <svg
                  viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                  className="w-full h-56 select-none"
                >
                  <defs>
                    <linearGradient
                      id={`equityGradient-${gradientId}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={
                          chartData.isProfitable ? "#10b981" : "#f59e0b"
                        }
                        stopOpacity="0.35"
                      />
                      <stop
                        offset="100%"
                        stopColor={
                          chartData.isProfitable ? "#10b981" : "#f59e0b"
                        }
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>

                  {/* Initial Balance Baseline */}
                  <line
                    x1="20"
                    y1={chartData.baselineY}
                    x2={chartData.width - 20}
                    y2={chartData.baselineY}
                    stroke="#52525b"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />

                  {/* Gradient Area Fill */}
                  <path
                    d={chartData.areaD}
                    fill={`url(#equityGradient-${gradientId})`}
                  />

                  {/* Equity Line */}
                  <path
                    d={chartData.pathD}
                    fill="none"
                    stroke={chartData.isProfitable ? "#10b981" : "#f59e0b"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive Points / Hover */}
                  {chartData.points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={hoveredPointIndex === i ? 5 : 2}
                      className="cursor-pointer transition-all fill-zinc-950 stroke-2"
                      stroke={chartData.isProfitable ? "#10b981" : "#f59e0b"}
                      onMouseEnter={() => setHoveredPointIndex(i)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    />
                  ))}
                </svg>

                {/* Y-Axis Labels */}
                <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-zinc-850">
                  <span>Start: {formatCurrency(initialBalance)}</span>
                  <span>Max: {formatCurrency(chartData.maxVal)}</span>
                  <span>Min: {formatCurrency(chartData.minVal)}</span>
                  <span>
                    Final:{" "}
                    {formatCurrency(
                      chartData.points[chartData.points.length - 1]?.pt.equity ??
                        initialBalance,
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500">
                No equity curve data available.
              </div>
            )}
          </div>

          {/* Historical Simulated Trades Table */}
          <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
              <div>
                <h3 className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
                  Simulated Executions Log
                </h3>
                <p className="text-xs text-zinc-500">
                  {backtestResult.trades.length} deterministic trade cycles completed
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto max-h-80 overflow-y-auto">
              {backtestResult.trades.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500">
                  No trades executed under current parameters. Try relaxing min
                  confidence or widening RSI thresholds.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-surface-100 z-10">
                    <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Entry Time</th>
                      <th className="py-2.5 px-3">Exit Time</th>
                      <th className="py-2.5 px-3">Side</th>
                      <th className="py-2.5 px-3">Entry Price</th>
                      <th className="py-2.5 px-3">Exit Price</th>
                      <th className="py-2.5 px-3">Size (BTC)</th>
                      <th className="py-2.5 px-3">Realized PnL ($)</th>
                      <th className="py-2.5 px-3">Return (%)</th>
                      <th className="py-2.5 px-3">Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {backtestResult.trades.map((trade: BacktestTrade, index: number) => {
                      const isProfit = trade.pnlUsd >= 0;
                      return (
                        <tr
                          key={index}
                          className="hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-zinc-500 font-mono">
                            {index + 1}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                            {new Date(trade.entryTimestamp).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                            {new Date(trade.exitTimestamp).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                trade.side === "LONG"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {trade.side}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-200 whitespace-nowrap font-mono">
                            {formatCurrency(trade.entryPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-200 whitespace-nowrap font-mono">
                            {formatCurrency(trade.exitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap font-mono">
                            {trade.sizeBtc}
                          </td>
                          <td
                            className={`py-2.5 px-3 whitespace-nowrap font-bold font-mono ${
                              isProfit ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {formatCurrency(trade.pnlUsd)}
                          </td>
                          <td
                            className={`py-2.5 px-3 whitespace-nowrap font-bold font-mono ${
                              isProfit ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {formatPercent(trade.pnlPercent)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                              {trade.exitReason}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sweep Mode: Ranked Parameter Table */}
      {activeTab === "sweep" && (
        <div className="rounded-2xl border border-zinc-800 bg-surface-100/60 p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
                Parameter Sweep Results (Ranked by Sharpe Ratio)
              </h3>
              <p className="text-xs text-zinc-500">
                Evaluating parameter combinations against the active scenario
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {sweepResults.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Click &ldquo;Execute Parameter Sweep&rdquo; above to run the grid
                search across parameter variations.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">RSI (L/S)</th>
                    <th className="py-2.5 px-3">SL / TP</th>
                    <th className="py-2.5 px-3">EMA (F/S)</th>
                    <th className="py-2.5 px-3">Trades</th>
                    <th className="py-2.5 px-3">Win Rate</th>
                    <th className="py-2.5 px-3">Total Return</th>
                    <th className="py-2.5 px-3">Max DD</th>
                    <th className="py-2.5 px-3">Sharpe</th>
                    <th className="py-2.5 px-3">Profit Factor</th>
                    <th className="py-2.5 px-3">Apply</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {sweepResults.map((item) => (
                    <tr
                      key={item.rank}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-btc-gold">
                        #{item.rank}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300 whitespace-nowrap">
                        {item.parameters.rsiLongThreshold} /{" "}
                        {item.parameters.rsiShortThreshold}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300 whitespace-nowrap">
                        {item.parameters.stopLossPercent}% /{" "}
                        {item.parameters.takeProfitPercent}%
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300 whitespace-nowrap">
                        {item.parameters.emaFastPeriod} /{" "}
                        {item.parameters.emaSlowPeriod}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                        {item.totalTrades}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-200 whitespace-nowrap font-bold">
                        {item.winRate}%
                      </td>
                      <td
                        className={`py-2.5 px-3 whitespace-nowrap font-bold ${
                          item.totalReturnPercent >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {formatPercent(item.totalReturnPercent)}
                      </td>
                      <td className="py-2.5 px-3 text-rose-400 whitespace-nowrap">
                        -{item.maxDrawdownPercent}%
                      </td>
                      <td className="py-2.5 px-3 text-cyan-400 font-bold whitespace-nowrap">
                        {item.sharpeRatio.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-btc-gold font-bold whitespace-nowrap">
                        {Number.isFinite(item.profitFactor)
                          ? item.profitFactor.toFixed(2)
                          : "∞"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setParams(item.parameters);
                            setSelectedPreset("custom");
                            setActiveTab("single");
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Use Params
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Interactive Data Replay Player */}
      {activeTab === "replay" && (
        <DataReplayPlayer />
      )}
    </div>
  );
}

