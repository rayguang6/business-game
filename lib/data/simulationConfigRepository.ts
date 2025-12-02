import { supabase } from '@/lib/supabase/client';
import type { BusinessMetrics, BusinessStats, MovementConfig, MapConfig } from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';

export interface GlobalSimulationConfigRow {
  business_metrics: BusinessMetrics | null;
  business_stats: BusinessStats | null;
  movement: MovementConfig | null;
  map_width?: number | null;
  map_height?: number | null;
  map_walls?: Array<{ x: number; y: number }> | null;
  // Layout columns removed - layout is now industry-specific only
  capacity_image: string | null;
  win_condition: WinCondition | null;
  lose_condition: LoseCondition | null;
  customer_images: string[] | null;
  staff_name_pool: string[] | null;
}

export interface GlobalSimulationConfigResult {
  businessMetrics?: BusinessMetrics;
  businessStats?: BusinessStats;
  movement?: MovementConfig;
  mapConfig?: MapConfig;
  // layoutConfig removed - each industry sets its own layout
  capacityImage?: string;
  winCondition?: WinCondition;
  loseCondition?: LoseCondition;
  customerImages?: string[];
  staffNamePool?: string[];
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
    typeof candidate.startingExp === 'number' &&
    typeof candidate.startingFreedomScore === 'number'
  ) {
    return {
      startingCash: candidate.startingCash,
      startingTime: typeof candidate.startingTime === 'number' ? candidate.startingTime : undefined,
      monthlyExpenses: candidate.monthlyExpenses,
      startingExp: candidate.startingExp, // Previously: startingSkillLevel
      startingFreedomScore: candidate.startingFreedomScore,
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
  if (typeof candidate.cashTarget === 'number') {
    return {
      cashTarget: candidate.cashTarget,
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
    typeof candidate.timeThreshold === 'number'
  ) {
    return {
      cashThreshold: candidate.cashThreshold,
      timeThreshold: candidate.timeThreshold,
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
    .select('business_metrics, business_stats, movement, map_width, map_height, map_walls, capacity_image, win_condition, lose_condition, customer_images, staff_name_pool')
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
  
  // Build map config from separate columns
  let mapConfig: MapConfig | undefined;
  if ((data.map_width !== null && data.map_width !== undefined) || (data.map_height !== null && data.map_height !== undefined)) {
    mapConfig = {
      width: data.map_width ?? 10,
      height: data.map_height ?? 10,
      walls: (data.map_walls as unknown as Array<{ x: number; y: number }>) || [],
    };
  }
  
  // Layout config removed - each industry sets its own layout
  
  const winCondition = mapWinCondition(data.win_condition);
  const loseCondition = mapLoseCondition(data.lose_condition);

  if (!businessMetrics && !businessStats && !movement && !mapConfig && !winCondition && !loseCondition && !data.capacity_image && !data.customer_images && !data.staff_name_pool) {
    return null;
  }

  const result: GlobalSimulationConfigResult = {};
  if (businessMetrics) result.businessMetrics = businessMetrics;
  if (businessStats) result.businessStats = businessStats;
  if (movement) result.movement = movement;
  if (mapConfig) result.mapConfig = mapConfig;
  if (data.capacity_image) result.capacityImage = data.capacity_image;
  if (winCondition) result.winCondition = winCondition;
  if (loseCondition) result.loseCondition = loseCondition;
  if (data.customer_images && Array.isArray(data.customer_images)) result.customerImages = data.customer_images;
  if (data.staff_name_pool && Array.isArray(data.staff_name_pool)) result.staffNamePool = data.staff_name_pool;

  return result;
}

export async function upsertGlobalSimulationConfig(config: {
  businessMetrics?: BusinessMetrics;
  businessStats?: BusinessStats;
  movement?: MovementConfig;
  mapConfig?: MapConfig;
  mapWidth?: number | null;
  mapHeight?: number | null;
  mapWalls?: Array<{ x: number; y: number }> | null;
  // Layout config removed - each industry sets its own layout
  capacityImage?: string | null;
  winCondition?: WinCondition;
  loseCondition?: LoseCondition;
  customerImages?: string[] | null;
  staffNamePool?: string[] | null;
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

  // Extract separate fields from mapConfig if provided (for backward compatibility)
  // But prefer explicit separate fields if provided
  const mapWidth = config.mapWidth ?? config.mapConfig?.width ?? null;
  const mapHeight = config.mapHeight ?? config.mapConfig?.height ?? null;
  const mapWalls = config.mapWalls ?? config.mapConfig?.walls ?? null;
  
  // Layout config removed - each industry sets its own layout

  // Note: Layout columns (entry_position, waiting_positions, service_rooms, staff_positions)
  // are deprecated and will be removed from the database. They're not included in the payload.
  const payload: GlobalSimulationConfigRow & { id: string } = {
    id: idToUse,
    business_metrics: config.businessMetrics ?? null,
    business_stats: config.businessStats ?? null,
    movement: config.movement ?? null,
    map_width: mapWidth,
    map_height: mapHeight,
    map_walls: mapWalls,
    capacity_image: config.capacityImage ?? null,
    win_condition: config.winCondition ?? null,
    lose_condition: config.loseCondition ?? null,
    customer_images: config.customerImages ?? null,
    staff_name_pool: config.staffNamePool ?? null,
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
