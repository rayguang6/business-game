import { supabase } from '@/lib/supabase/client';
import type { BusinessMetrics, BusinessStats, MovementConfig } from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';

export interface GlobalSimulationConfigRow {
  business_metrics: BusinessMetrics | null;
  business_stats: BusinessStats | null;
  movement: MovementConfig | null;
  win_condition: WinCondition | null;
  lose_condition: LoseCondition | null;
}

export interface GlobalSimulationConfigResult {
  businessMetrics?: BusinessMetrics;
  businessStats?: BusinessStats;
  movement?: MovementConfig;
  winCondition?: WinCondition;
  loseCondition?: LoseCondition;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const mapBusinessMetrics = (raw: unknown): BusinessMetrics | undefined => {
  if (!isObject(raw)) {
    return undefined;
  }
  const candidate = raw as unknown as BusinessMetrics;
  if (
    typeof candidate.startingCash === 'number' &&
    typeof candidate.monthlyExpenses === 'number' &&
    typeof candidate.startingReputation === 'number' &&
    typeof candidate.founderWorkHours === 'number'
  ) {
    return {
      startingCash: candidate.startingCash,
      monthlyExpenses: candidate.monthlyExpenses,
      startingReputation: candidate.startingReputation,
      founderWorkHours: candidate.founderWorkHours,
    };
  }
  return undefined;
};

const mapBusinessStats = (raw: unknown): BusinessStats | undefined => {
  if (!isObject(raw)) {
    return undefined;
  }
  const candidate = raw as unknown as BusinessStats;
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
  const candidate = raw as unknown as MovementConfig;
  if (
    typeof candidate.customerTilesPerTick === 'number' &&
    typeof candidate.animationReferenceTilesPerTick === 'number' &&
    typeof candidate.walkFrameDurationMs === 'number'
  ) {
    return candidate;
  }
  return undefined;
};

const mapWinCondition = (raw: unknown): WinCondition | undefined => {
  if (!isObject(raw)) {
    return undefined;
  }
  const candidate = raw as unknown as WinCondition;
  if (
    typeof candidate.founderHoursMax === 'number' &&
    typeof candidate.monthlyProfitTarget === 'number' &&
    typeof candidate.consecutiveMonthsRequired === 'number'
  ) {
    return {
      founderHoursMax: candidate.founderHoursMax,
      monthlyProfitTarget: candidate.monthlyProfitTarget,
      consecutiveMonthsRequired: candidate.consecutiveMonthsRequired,
    };
  }
  return undefined;
};

const mapLoseCondition = (raw: unknown): LoseCondition | undefined => {
  if (!isObject(raw)) {
    return undefined;
  }
  const candidate = raw as unknown as LoseCondition;
  if (
    typeof candidate.cashThreshold === 'number' &&
    typeof candidate.reputationThreshold === 'number' &&
    typeof candidate.founderHoursMax === 'number'
  ) {
    return {
      cashThreshold: candidate.cashThreshold,
      reputationThreshold: candidate.reputationThreshold,
      founderHoursMax: candidate.founderHoursMax,
    };
  }
  return undefined;
};

export async function fetchGlobalSimulationConfig(): Promise<GlobalSimulationConfigResult | null> {
  if (!supabase) {
    console.error('Supabase client not configured. Unable to fetch global simulation config.');
    return null;
  }

  const { data, error } = await supabase
    .from('global_simulation_config')
    .select('business_metrics, business_stats, movement, win_condition, lose_condition')
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
  const winCondition = mapWinCondition(data.win_condition);
  const loseCondition = mapLoseCondition(data.lose_condition);

  if (!businessMetrics && !businessStats && !movement && !winCondition && !loseCondition) {
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
  if (winCondition) {
    result.winCondition = winCondition;
  }
  if (loseCondition) {
    result.loseCondition = loseCondition;
  }

  return result;
}

export async function upsertGlobalSimulationConfig(config: {
  businessMetrics?: BusinessMetrics;
  businessStats?: BusinessStats;
  movement?: MovementConfig;
  winCondition?: WinCondition;
  loseCondition?: LoseCondition;
}): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Determine a stable id to upsert to. If a row exists, reuse its id; otherwise use 'global'.
  const { data: existing, error: selectError } = await supabase
    .from('global_simulation_config')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (selectError) {
    console.error('Failed to check existing global config row', selectError);
    // Continue with default id to avoid blocking saves entirely
  }

  const idToUse = existing?.id ?? 'global';

  const payload: GlobalSimulationConfigRow & { id: string } = {
    id: idToUse,
    business_metrics: config.businessMetrics ?? null,
    business_stats: config.businessStats ?? null,
    movement: config.movement ?? null,
    win_condition: config.winCondition ?? null,
    lose_condition: config.loseCondition ?? null,
  };

  const { error: upsertError } = await supabase
    .from('global_simulation_config')
    .upsert(payload, { onConflict: 'id' });

  if (upsertError) {
    console.error('Failed to upsert global simulation config', upsertError);
    return { success: false, message: upsertError.message };
  }

  return { success: true };
}
