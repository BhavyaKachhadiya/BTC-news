"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Check,
  CheckCheck,
  Trash2,
  Sparkles,
  TrendingUp,
  Layers,
  Percent,
  AlertTriangle,
  MessageSquare,
  X,
  ExternalLink,
} from "lucide-react";
import type { WebAlert, AlertRulesConfig } from "../types/alert.types";
import { playAlertChime, sendBrowserNotification } from "../utils/browser-notification";

export function WebNotificationBell() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<readonly WebAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [config, setConfig] = useState<AlertRulesConfig | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const previousAlertCountRef = useRef<number>(0);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      const json = await res.json();
      if (json.success && json.data) {
        const newAlerts: readonly WebAlert[] = json.data.alerts;
        const newUnread: number = json.data.unreadCount;
        setConfig(json.data.config);

        // Check if new unread alerts arrived
        if (
          previousAlertCountRef.current > 0 &&
          newAlerts.length > previousAlertCountRef.current &&
          newUnread > 0
        ) {
          const latest = newAlerts[0];
          if (json.data.config.soundEnabled) {
            playAlertChime();
          }
          if (json.data.config.browserNotifications && Notification.permission === "granted") {
            sendBrowserNotification(latest.title, {
              body: latest.message,
              icon: "/favicon.ico",
            });
          }
        }

        previousAlertCountRef.current = newAlerts.length;
        setAlerts(newAlerts);
        setUnreadCount(newUnread);
      }
    } catch {
      // Ignore network errors during polling
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
    const interval = setInterval(fetchAlerts, 15_000); // 15s poll
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted" && config) {
      updateSettings({ browserNotifications: true });
    }
  };

  const updateSettings = async (patch: Partial<AlertRulesConfig>) => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateConfig", config: patch }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setConfig(json.data);
      }
    } catch {
      // Ignore
    }
  };

  const handleTestAlert = async () => {
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (config?.soundEnabled) {
          playAlertChime();
        }
        if (config?.browserNotifications) {
          sendBrowserNotification(json.data.title, {
            body: json.data.message,
            icon: "/favicon.ico",
          });
        }
        await fetchAlerts();
      }
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      setUnreadCount(0);
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch {
      // Ignore
    }
  };

  const handleClearAlerts = async () => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      setAlerts([]);
      setUnreadCount(0);
      previousAlertCountRef.current = 0;
    } catch {
      // Ignore
    }
  };

  const getAlertIcon = (type: WebAlert["type"]) => {
    switch (type) {
      case "SIGNAL_GENERATED":
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      case "WHALE_MOVEMENT":
        return <Layers className="w-3.5 h-3.5 text-btc-gold" />;
      case "FUNDING_SPIKE":
        return <Percent className="w-3.5 h-3.5 text-amber-400" />;
      case "NETWORK_CONGESTION":
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case "HIGH_IMPACT_NEWS":
        return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition cursor-pointer"
        title="Web Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-btc-gold animate-bounce" />
        ) : (
          <Bell className="w-4 h-4" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-surface-900 shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl backdrop-blur-xl z-50 overflow-hidden flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-btc-gold" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Web Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Sound Toggle */}
              {config && (
                <button
                  onClick={() => updateSettings({ soundEnabled: !config.soundEnabled })}
                  className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                    config.soundEnabled
                      ? "bg-zinc-800 border-zinc-700 text-zinc-200"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500"
                  }`}
                  title={config.soundEnabled ? "Mute alert audio chime" : "Enable alert audio chime"}
                >
                  {config.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Browser Permission Prompt Banner */}
          {permission !== "granted" && (
            <div className="p-2.5 bg-btc-gold/10 border-b border-btc-gold/20 flex items-center justify-between gap-2 text-xs">
              <span className="text-zinc-300 text-[11px]">
                Desktop push alerts are {permission === "denied" ? "blocked" : "disabled"}.
              </span>
              {permission !== "denied" && (
                <button
                  onClick={requestNotificationPermission}
                  className="px-2 py-1 rounded bg-btc-gold text-zinc-950 font-bold text-[10px] hover:bg-btc-gold/90 transition cursor-pointer shrink-0"
                >
                  Enable Push
                </button>
              )}
            </div>
          )}

          {/* Alerts Scrollable Body */}
          <div className="overflow-y-auto flex-1 divide-y divide-zinc-850/60 p-1">
            {alerts.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Bell className="w-6 h-6 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-500">No active alerts recorded yet.</p>
                <button
                  onClick={handleTestAlert}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-medium transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-btc-gold" /> Trigger Sample Web Alert
                </button>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl transition ${
                    !alert.isRead ? "bg-zinc-900/60" : "bg-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0 mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-zinc-100 truncate">
                          {alert.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase border shrink-0 ${
                            alert.severity === "critical"
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              : alert.severity === "warning"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight">
                        {alert.message}
                      </p>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          {alerts.length > 0 && (
            <div className="p-2.5 border-t border-zinc-850 bg-zinc-900/40 flex items-center justify-between text-xs">
              <button
                onClick={handleTestAlert}
                className="text-[11px] text-btc-gold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Test Alert
              </button>

              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3 text-emerald-400" /> Mark all read
                  </button>
                )}
                <button
                  onClick={handleClearAlerts}
                  className="text-[11px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
