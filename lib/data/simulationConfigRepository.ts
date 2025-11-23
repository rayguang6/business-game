import { supabase } from '@/lib/supabase/client';
import type { BusinessMetrics, BusinessStats, MovementConfig, MapConfig, SimulationLayoutConfig, GridPosition } from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';

export interface GlobalSimulationConfigRow {
  business_metrics: BusinessMetrics | null;
  business_stats: BusinessStats | null;
  movement: MovementConfig | null;
  map_config: MapConfig | null; // Keep for backward compatibility
  map_width?: number | null;
  map_height?: number | null;
  map_walls?: Array<{ x: number; y: number }> | null;
  layout_config: SimulationLayoutConfig | null; // Keep for backward compatibility
  entry_position?: GridPosition | null;
  waiting_positions?: GridPosition[] | null;
  service_room_positions?: GridPosition[] | null;
  staff_positions?: GridPosition[] | null;
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
  layoutConfig?: SimulationLayoutConfig;
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

const mapMapConfig = (raw: unknown): MapConfig | undefined => {
  if (!isObject(raw)) return undefined;
  const c = raw as unknown as MapConfig;
  if (typeof c.width === 'number' && typeof c.height === 'number' && Array.isArray(c.walls)) {
    return c;
  }
  return undefined;
};

const mapLayoutConfig = (raw: unknown): SimulationLayoutConfig | undefined => {
  if (!isObject(raw)) return undefined;
  const c = raw as unknown as SimulationLayoutConfig;
  if (
    c.entryPosition &&
    typeof c.entryPosition.x === 'number' &&
    typeof c.entryPosition.y === 'number' &&
    Array.isArray(c.waitingPositions) &&
    Array.isArray(c.serviceRoomPositions) &&
    Array.isArray(c.staffPositions)
  ) {
    return c;
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
    .select('business_metrics, business_stats, movement, map_width, map_height, map_walls, map_config, entry_position, waiting_positions, service_room_positions, staff_positions, layout_config, capacity_image, win_condition, lose_condition, customer_images, staff_name_pool')
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
  
  // Build map config from separate columns (preferred) or fallback to map_config JSONB
  let mapConfig: MapConfig | undefined;
  if ((data.map_width !== null && data.map_width !== undefined) || (data.map_height !== null && data.map_height !== undefined)) {
    mapConfig = {
      width: data.map_width ?? 10,
      height: data.map_height ?? 10,
      walls: (data.map_walls as unknown as Array<{ x: number; y: number }>) || [],
    };
  } else {
    mapConfig = mapMapConfig(data.map_config);
  }
  
  // Build layout config from separate columns (preferred) or fallback to layout_config
  let layoutConfig: SimulationLayoutConfig | undefined;
  if (data.entry_position || data.waiting_positions || data.service_room_positions || data.staff_positions) {
    layoutConfig = {
      entryPosition: (data.entry_position as unknown as GridPosition) || { x: 0, y: 0 },
      waitingPositions: (data.waiting_positions as unknown as GridPosition[]) || [],
      serviceRoomPositions: (data.service_room_positions as unknown as GridPosition[]) || [],
      staffPositions: (data.staff_positions as unknown as GridPosition[]) || [],
    };
  } else {
    layoutConfig = mapLayoutConfig(data.layout_config);
  }
  
  const winCondition = mapWinCondition(data.win_condition);
  const loseCondition = mapLoseCondition(data.lose_condition);

  if (!businessMetrics && !businessStats && !movement && !mapConfig && !layoutConfig && !winCondition && !loseCondition && !data.capacity_image && !data.customer_images && !data.staff_name_pool) {
    return null;
  }

  const result: GlobalSimulationConfigResult = {};
  if (businessMetrics) result.businessMetrics = businessMetrics;
  if (businessStats) result.businessStats = businessStats;
  if (movement) result.movement = movement;
  if (mapConfig) result.mapConfig = mapConfig;
  if (layoutConfig) result.layoutConfig = layoutConfig;
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
  layoutConfig?: SimulationLayoutConfig;
    entryPosition?: GridPosition | null;
    waitingPositions?: GridPosition[] | null;
    serviceRoomPositions?: GridPosition[] | null;
    staffPositions?: GridPosition[] | null;
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

  const payload: GlobalSimulationConfigRow & { id: string } = {
    id: idToUse,
    business_metrics: config.businessMetrics ?? null,
    business_stats: config.businessStats ?? null,
    movement: config.movement ?? null,
    map_config: config.mapConfig ?? null, // Keep for backward compatibility
    map_width: config.mapWidth ?? null,
    map_height: config.mapHeight ?? null,
    map_walls: config.mapWalls ?? null,
    layout_config: config.layoutConfig ?? null, // Keep for backward compatibility
    entry_position: config.entryPosition ?? null,
    waiting_positions: config.waitingPositions ?? null,
    service_room_positions: config.serviceRoomPositions ?? null,
    staff_positions: config.staffPositions ?? null,
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
