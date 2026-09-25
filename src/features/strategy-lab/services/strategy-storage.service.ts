import { prisma } from "@/shared/database/prisma";
import { logger } from "@/shared/logger/logger";
import type { StrategyParameters, StrategyPresetKey } from "../types/strategy.types";
import type { IntelligenceFeatures } from "@/config/features";

export interface SavedStrategyDto {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly preset: string;
  readonly parameters: StrategyParameters;
  readonly features?: IntelligenceFeatures | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateStrategyInput {
  readonly name: string;
  readonly description?: string;
  readonly preset: StrategyPresetKey | "custom";
  readonly parameters: StrategyParameters;
  readonly features?: IntelligenceFeatures;
}

export class StrategyStorageService {
  // In-memory fallback if database is offline or uninitialized
  private inMemoryStrategies: Map<string, SavedStrategyDto> = new Map();

  public async listStrategies(): Promise<readonly SavedStrategyDto[]> {
    try {
      const records = await prisma.savedStrategy.findMany({
        orderBy: { createdAt: "desc" },
      });

      return records.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        preset: r.preset,
        parameters: JSON.parse(r.parameters) as StrategyParameters,
        features: r.features ? (JSON.parse(r.features) as IntelligenceFeatures) : null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    } catch (err) {
      logger.warn("Database unavailable for listStrategies, serving from in-memory fallback", "StrategyStorageService", {
        error: String(err),
      });
      return Array.from(this.inMemoryStrategies.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }

  public async getStrategyById(id: string): Promise<SavedStrategyDto | null> {
    try {
      const record = await prisma.savedStrategy.findUnique({
        where: { id },
      });
      if (!record) return this.inMemoryStrategies.get(id) ?? null;

      return {
        id: record.id,
        name: record.name,
        description: record.description,
        preset: record.preset,
        parameters: JSON.parse(record.parameters) as StrategyParameters,
        features: record.features ? (JSON.parse(record.features) as IntelligenceFeatures) : null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    } catch (err) {
      return this.inMemoryStrategies.get(id) ?? null;
    }
  }

  public async createStrategy(input: CreateStrategyInput): Promise<SavedStrategyDto> {
    const serializedParams = JSON.stringify(input.parameters);
    const serializedFeatures = input.features ? JSON.stringify(input.features) : null;

    try {
      const record = await prisma.savedStrategy.create({
        data: {
          name: input.name,
          description: input.description,
          preset: input.preset,
          parameters: serializedParams,
          features: serializedFeatures,
        },
      });

      const dto: SavedStrategyDto = {
        id: record.id,
        name: record.name,
        description: record.description,
        preset: record.preset,
        parameters: input.parameters,
        features: input.features ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
      this.inMemoryStrategies.set(dto.id, dto);
      return dto;
    } catch (err) {
      logger.warn("Database unavailable for createStrategy, storing in in-memory fallback", "StrategyStorageService", {
        error: String(err),
      });
      const generatedId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();
      const fallbackDto: SavedStrategyDto = {
        id: generatedId,
        name: input.name,
        description: input.description,
        preset: input.preset,
        parameters: input.parameters,
        features: input.features ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.inMemoryStrategies.set(generatedId, fallbackDto);
      return fallbackDto;
    }
  }

  public async deleteStrategy(id: string): Promise<boolean> {
    this.inMemoryStrategies.delete(id);
    try {
      await prisma.savedStrategy.delete({
        where: { id },
      });
      return true;
    } catch (err) {
      return true;
    }
  }
}

export const strategyStorageService = new StrategyStorageService();
