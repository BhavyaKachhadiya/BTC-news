import { logger } from "@/shared/logger/logger";
import { dxyService, DxyService } from "./dxy.service";
import { yieldsService, YieldsService } from "./yields.service";
import { commoditiesService, CommoditiesService } from "./commodities.service";
import { equitiesService, EquitiesService } from "./equities.service";
import type {
  MacroSnapshot,
  MacroProvider,
  DataAvailability,
  MacroRegimeType,
} from "../types/macro.types";

export interface MacroServiceConfig {
  readonly dxyService?: DxyService;
  readonly yieldsService?: YieldsService;
  readonly commoditiesService?: CommoditiesService;
  readonly equitiesService?: EquitiesService;
  readonly maxAgeMs?: number;
}

export class MacroService implements MacroProvider {
  private readonly dxyService: DxyService;
  private readonly yieldsService: YieldsService;
  private readonly commoditiesService: CommoditiesService;
  private readonly equitiesService: EquitiesService;
  private readonly maxAgeMs: number;
  private lastSnapshot: MacroSnapshot | null = null;

  constructor(config: MacroServiceConfig = {}) {
    this.dxyService = config.dxyService ?? dxyService;
    this.yieldsService = config.yieldsService ?? yieldsService;
    this.commoditiesService = config.commoditiesService ?? commoditiesService;
    this.equitiesService = config.equitiesService ?? equitiesService;
    this.maxAgeMs = config.maxAgeMs ?? 1000 * 60 * 60 * 24; // 24 hours
  }

  /**
   * Fetches unified macro snapshot across DXY, Yields, Gold, and Equities.
   * Catches all errors gracefully to ensure the pipeline NEVER crashes when external macro APIs are unavailable.
   */
  public async getMacroSnapshot(options: { allowFallback?: boolean } = {}): Promise<MacroSnapshot> {
    const { allowFallback = true } = options;
    logger.info("Ingesting Macro Intelligence snapshot (DXY, Yields, Gold, Equities)", "MacroService");

    try {
      const [dxySettled, yieldsSettled, goldSettled, equitiesSettled] = await Promise.allSettled([
        Promise.resolve().then(() => this.dxyService.fetchLiveQuote()),
        Promise.resolve().then(() => this.yieldsService.fetchLiveYields()),
        Promise.resolve().then(() => this.commoditiesService.fetchLiveGold()),
        Promise.resolve().then(() => this.equitiesService.fetchLiveEquities()),
      ]);

    let hadLiveFailure = false;
    let hadAtLeastOneSuccess = false;

    // Resolve DXY
    let dxyData: { value: number; changePercent: number } | undefined;
    if (dxySettled.status === "fulfilled") {
      dxyData = {
        value: dxySettled.value.value,
        changePercent: dxySettled.value.changePercent,
      };
      hadAtLeastOneSuccess = true;
    } else {
      hadLiveFailure = true;
      logger.debug("DXY live fetch failed, resolving fallback", "MacroService", {
        reason: String(dxySettled.reason),
      });
      if (allowFallback) {
        try {
          const fallback = await this.dxyService.getDxyQuote(true);
          dxyData = { value: fallback.value, changePercent: fallback.changePercent };
        } catch {
          // Keep undefined
        }
      }
    }

    // Resolve Treasury Yields
    let treasuryData: { twoYear?: number; tenYear?: number } | undefined;
    if (yieldsSettled.status === "fulfilled") {
      treasuryData = {
        twoYear: yieldsSettled.value.twoYear,
        tenYear: yieldsSettled.value.tenYear,
      };
      hadAtLeastOneSuccess = true;
    } else {
      hadLiveFailure = true;
      logger.debug("Yields live fetch failed, resolving fallback", "MacroService", {
        reason: String(yieldsSettled.reason),
      });
      if (allowFallback) {
        try {
          const fallback = await this.yieldsService.getYields(true);
          treasuryData = {
            twoYear: fallback.twoYear,
            tenYear: fallback.tenYear,
          };
        } catch {
          // Keep undefined
        }
      }
    }

    // Resolve Gold
    let goldData: { price: number; changePercent: number } | undefined;
    if (goldSettled.status === "fulfilled") {
      goldData = {
        price: goldSettled.value.price,
        changePercent: goldSettled.value.changePercent,
      };
      hadAtLeastOneSuccess = true;
    } else {
      hadLiveFailure = true;
      logger.debug("Gold live fetch failed, resolving fallback", "MacroService", {
        reason: String(goldSettled.reason),
      });
      if (allowFallback) {
        try {
          const fallback = await this.commoditiesService.getGoldQuote(true);
          goldData = { price: fallback.price, changePercent: fallback.changePercent };
        } catch {
          // Keep undefined
        }
      }
    }

    // Resolve Equities
    let equitiesData: { sp500?: number; nasdaq?: number } | undefined;
    if (equitiesSettled.status === "fulfilled") {
      equitiesData = {
        sp500: equitiesSettled.value.sp500,
        nasdaq: equitiesSettled.value.nasdaq,
      };
      hadAtLeastOneSuccess = true;
    } else {
      hadLiveFailure = true;
      logger.debug("Equities live fetch failed, resolving fallback", "MacroService", {
        reason: String(equitiesSettled.reason),
      });
      if (allowFallback) {
        try {
          const fallback = await this.equitiesService.getEquitiesQuote(true);
          equitiesData = {
            sp500: fallback.sp500,
            nasdaq: fallback.nasdaq,
          };
        } catch {
          // Keep undefined
        }
      }
    }

    // Freshness Classification
    let freshness: DataAvailability;
    const hasAnyData = Boolean(dxyData || treasuryData || goldData || equitiesData);

    if (!hasAnyData) {
      freshness = "unavailable";
    } else if (hadLiveFailure) {
      freshness = "stale";
    } else if (hadAtLeastOneSuccess) {
      freshness = "available";
    } else {
      freshness = "unavailable";
    }

    const snapshot: MacroSnapshot = {
      timestamp: new Date().toISOString(),
      dxy: dxyData,
      treasury: treasuryData,
      equities: equitiesData,
      gold: goldData,
      freshness,
    };

    this.lastSnapshot = snapshot;

    logger.info(
      `Macro snapshot generated: Freshness=${freshness} (DXY=${dxyData?.value ?? "N/A"}, 10Y=${treasuryData?.tenYear ?? "N/A"}%, SP500=${equitiesData?.sp500 ?? "N/A"})`,
      "MacroService",
    );

    return snapshot;
    } catch (unexpectedError: unknown) {
      logger.error("Unexpected error during macro snapshot generation", "MacroService", {
        error: String(unexpectedError),
      });

      return {
        timestamp: new Date().toISOString(),
        freshness: "unavailable",
      };
    }
  }

  public getLastSnapshot(): MacroSnapshot | null {
    return this.lastSnapshot;
  }

  /**
   * Deterministically interprets current macro regime for BTC context:
   * - Risk-On: Falling DXY + Rising/Strong Equities
   * - Risk-Off: Surging DXY + Falling Equities / Surging Yields
   * - Neutral: Divergent or sideways indicators
   */
  public interpretRegime(snapshot: MacroSnapshot): {
    readonly regime: MacroRegimeType;
    readonly summary: string;
  } {
    const dxyChange = snapshot.dxy?.changePercent ?? 0;
    const isDxyWeakening = dxyChange < -0.1;
    const isDxySurging = dxyChange > 0.2;

    const sp500 = snapshot.equities?.sp500;
    const isEquitiesStrong = sp500 !== undefined && sp500 > 5000;

    if (isDxyWeakening && isEquitiesStrong) {
      return {
        regime: "risk-on",
        summary: "Dollar softening and equitable liquidity expansion creates macro tailwinds for Bitcoin.",
      };
    }

    if (isDxySurging) {
      return {
        regime: "risk-off",
        summary: "Dollar strength and tightening financial conditions create headwind resistance for risk assets.",
      };
    }

    return {
      regime: "neutral",
      summary: "Macro conditions are balanced with neutral dollar momentum and stable debt yields.",
    };
  }
}

export const macroService = new MacroService();
