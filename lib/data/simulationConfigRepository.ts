import { supabase } from '@/lib/supabase/client';
import type { BusinessMetrics, BusinessStats, MovementConfig } from '@/lib/game/types';

export interface GlobalSimulationConfigRow {
  business_metrics: BusinessMetrics | null;
  business_stats: BusinessStats | null;
  movement: MovementConfig | null;
}

export interface GlobalSimulationConfigResult {
  businessMetrics?: BusinessMetrics;
  businessStats?: BusinessStats;
  movement?: MovementConfig;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const mapBusinessMetrics = (raw: unknown): BusinessMetrics | undefined => {
  if (!isObject(raw)) {
    return undefined;
  }
  const candidate = raw as BusinessMetrics;
  if (
    typeof candidate.startingCash === 'number' &&
    typeof candidate.monthlyExpenses === 'number' &&
    typeof candidate.startingReputation === 'number'
  ) {
    return {
      startingCash: candidate.startingCash,
      monthlyExpenses: candidate.monthlyExpenses,
      startingReputation: candidate.startingReputation,
    };
  }
  return undefined;
};

const mapBusinessStats = (raw: unknown): BusinessStats | undefined => {
  if (!isObject(raw)) {
    return undefined;
  }
  const candidate = raw as BusinessStats;
  if (
    typeof candidate.ticksPerSecond === 'number' &&
    typeof candidate.monthDurationSeconds === 'number' &&
    typeof candidate.customerSpawnIntervalSeconds === 'number'
  ) {
    const spawnPosition = candidate.customerSpawnPosition;
    if (spawnPosition && typeof spawnPosition.x === 'number' && typeof spawnPosition.y === 'number') {
      return candidate;
    }
  }
  return undefined;
};

const mapMovementConfig = (raw: unknown): MovementConfig | undefined => {
  if (!isObject(raw)) {
    return undefined;
  }
  const candidate = raw as MovementConfig;
  if (
    typeof candidate.customerTilesPerTick === 'number' &&
    typeof candidate.animationReferenceTilesPerTick === 'number' &&
    typeof candidate.walkFrameDurationMs === 'number'
  ) {
    return candidate;
  }
  return undefined;
};

export async function fetchGlobalSimulationConfig(): Promise<GlobalSimulationConfigResult | null> {
  if (!supabase) {
    console.error('Supabase client not configured. Unable to fetch global simulation config.');
    return null;
  }

  const { data, error } = await supabase
    .from<GlobalSimulationConfigRow>('global_simulation_config')
    .select('business_metrics, business_stats, movement')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch global simulation config from Supabase', error);
    return null;
  }

  if (!data) {
    return null;
  }

  const businessMetrics = mapBusinessMetrics(data.business_metrics);
  const businessStats = mapBusinessStats(data.business_stats);
  const movement = mapMovementConfig(data.movement);

  if (!businessMetrics && !businessStats && !movement) {
    return null;
  }

  const result: GlobalSimulationConfigResult = {};
  if (businessMetrics) {
    result.businessMetrics = businessMetrics;
  }
  if (businessStats) {
    result.businessStats = businessStats;
  }
  if (movement) {
    result.movement = movement;
  }

  return result;
}
