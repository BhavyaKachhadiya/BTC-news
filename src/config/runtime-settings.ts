/**
 * Runtime settings singleton.
 * Uses a global symbol so the value survives Next.js hot-module-reload in dev.
 * On a real server restart the value resets to the env default (correct behavior).
 */
import { env } from "@/config/env";

interface RuntimeSettings {
  enableJev: boolean;
}

const GLOBAL_KEY = Symbol.for("btc_signal_engine.runtime_settings");

declare global {
  var __runtimeSettings: RuntimeSettings | undefined;
}

function getSettings(): RuntimeSettings {
  if (!global.__runtimeSettings) {
    global.__runtimeSettings = { enableJev: env.ENABLE_JEV };
  }
  return global.__runtimeSettings;
}

export function getRuntimeSettings(): RuntimeSettings {
  return getSettings();
}

export function setRuntimeSettings(patch: Partial<RuntimeSettings>): RuntimeSettings {
  const current = getSettings();
  global.__runtimeSettings = { ...current, ...patch };
  return global.__runtimeSettings;
}

// Suppress "unused variable" lint for GLOBAL_KEY
void GLOBAL_KEY;
