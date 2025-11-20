import { supabase } from '@/lib/supabase/client';
import type { IndustryId, GridPosition } from '@/lib/game/types';
import type {
  BusinessMetrics,
  BusinessStats,
  MovementConfig,
  MapConfig,
  SimulationLayoutConfig,
} from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';
import { parsePositions } from './layoutRepository';

export interface IndustrySimulationConfigResult {
  businessMetrics?: BusinessMetrics;
  businessStats?: BusinessStats;
  // Movement removed - it's global only (same across all industries)
  mapConfig?: MapConfig;
  layoutConfig?: SimulationLayoutConfig;
  capacityImage?: string;
  winCondition?: WinCondition;
  loseCondition?: LoseCondition;
  // customerImages and staffNamePool removed - they're global only (same across all industries)
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const mapBusinessMetrics = (raw: unknown): BusinessMetrics | undefined => {
  if (!isObject(raw)) return undefined;
  const c = raw as unknown as BusinessMetrics;
  if (
    typeof c.startingCash === 'number' &&
    typeof c.monthlyExpenses === 'number' &&
    typeof c.startingSkillLevel === 'number' &&
    (typeof c.startingFreedomScore === 'number' || typeof (c as any).founderWorkHours === 'number') // Support legacy founderWorkHours
  ) {
    return {
      ...c,
      startingTime: typeof c.startingTime === 'number' ? c.startingTime : undefined,
      startingFreedomScore: c.startingFreedomScore ?? (c as any).founderWorkHours, // Support legacy founderWorkHours
    };
  }
  return undefined;
};

const mapBusinessStats = (raw: unknown): BusinessStats | undefined => {
  if (!isObject(raw)) return undefined;
  const c = raw as unknown as BusinessStats;
  if (
    typeof c.ticksPerSecond === 'number' &&
    typeof c.monthDurationSeconds === 'number' &&
    typeof c.customerSpawnIntervalSeconds === 'number'
  ) {
    const pos = c.customerSpawnPosition;
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
      return c;
    }
  }
  return undefined;
};

const mapMovementConfig = (raw: unknown): MovementConfig | undefined => {
  if (!isObject(raw)) return undefined;
  const c = raw as unknown as MovementConfig;
  if (
    typeof c.customerTilesPerTick === 'number' &&
    typeof c.animationReferenceTilesPerTick === 'number' &&
    typeof c.walkFrameDurationMs === 'number'
  ) {
    return c;
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

const mapWinCondition = (raw: unknown): WinCondition | undefined => {
  if (!isObject(raw)) return undefined;
  const c = raw as unknown as WinCondition;
  // Simplified win condition: only cashTarget
  if (typeof c.cashTarget === 'number') {
    return {
      cashTarget: c.cashTarget,
    };
  }
  return undefined;
};

const mapLoseCondition = (raw: unknown): LoseCondition | undefined => {
  if (!isObject(raw)) return undefined;
  const c = raw as unknown as LoseCondition;
  // Simplified lose condition: cashThreshold and timeThreshold only
  if (
    typeof c.cashThreshold === 'number' &&
    typeof c.timeThreshold === 'number'
  ) {
    return {
      cashThreshold: c.cashThreshold,
      timeThreshold: c.timeThreshold,
    };
  }
  return undefined;
};

/**
 * Fetch industry-specific simulation configuration
 * Returns null if not found (will use global defaults)
 */
export async function fetchIndustrySimulationConfig(
  industryId: IndustryId,
): Promise<IndustrySimulationConfigResult | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('industry_simulation_config')
    .select('business_metrics, business_stats, map_width, map_height, map_walls, map_config, entry_position, waiting_positions, service_room_positions, staff_positions, layout_config, capacity_image, win_condition, lose_condition')
    .eq('industry_id', industryId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch industry simulation config:', error);
    return null;
  }

  if (!data) {
    return null; // No config exists, will use global defaults
  }

  const result: IndustrySimulationConfigResult = {};
  
  if (data.business_metrics) {
    const metrics = mapBusinessMetrics(data.business_metrics);
    if (metrics) result.businessMetrics = metrics;
  }
  
  if (data.business_stats) {
    const stats = mapBusinessStats(data.business_stats);
    if (stats) result.businessStats = stats;
  }
  
  // Build map config from separate columns (preferred) or fallback to map_config JSONB
  // Check if we have any map data: width, height, or walls
  const hasMapWidth = data.map_width !== null && data.map_width !== undefined;
  const hasMapHeight = data.map_height !== null && data.map_height !== undefined;
  const hasMapWalls = data.map_walls !== null && data.map_walls !== undefined && Array.isArray(data.map_walls) && (data.map_walls as Array<unknown>).length > 0;
  
  if (hasMapWidth || hasMapHeight || hasMapWalls) {
    const mapConfig: MapConfig = {
      width: data.map_width ?? 10,
      height: data.map_height ?? 10,
      walls: (data.map_walls as unknown as Array<{ x: number; y: number }>) || [],
    };
    result.mapConfig = mapConfig;
  } else if (data.map_config) {
    // Fallback to old map_config column for backward compatibility
    const mapConfig = mapMapConfig(data.map_config);
    if (mapConfig) result.mapConfig = mapConfig;
  }
  
  // Build layout config from separate columns (or fallback to layout_config for backward compatibility)
  if (data.entry_position || data.waiting_positions || data.service_room_positions || data.staff_positions) {
    // Use parsePositions to properly parse facingDirection if present
    const waitingPositions = parsePositions(data.waiting_positions) || [];
    const serviceRoomPositions = parsePositions(data.service_room_positions) || [];
    const staffPositions = parsePositions(data.staff_positions) || [];
    
    const layoutConfig: SimulationLayoutConfig = {
      entryPosition: (data.entry_position as unknown as GridPosition) || { x: 0, y: 0 },
      waitingPositions,
      serviceRoomPositions,
      staffPositions,
    };
    result.layoutConfig = layoutConfig;
  } else if (data.layout_config) {
    // Fallback to old layout_config column for backward compatibility
    const layoutConfig = mapLayoutConfig(data.layout_config);
    if (layoutConfig) result.layoutConfig = layoutConfig;
  }
  
  if (data.capacity_image) {
    result.capacityImage = data.capacity_image;
  }
  
  if (data.win_condition) {
    const winCondition = mapWinCondition(data.win_condition);
    if (winCondition) result.winCondition = winCondition;
  }
  
  if (data.lose_condition) {
    const loseCondition = mapLoseCondition(data.lose_condition);
    if (loseCondition) result.loseCondition = loseCondition;
  }
  
  // customerImages and staffNamePool removed - they're global only

  return result;
}

/**
 * Upsert industry-specific simulation configuration
 */
export async function upsertIndustrySimulationConfig(
  industryId: IndustryId,
  config: {
    businessMetrics?: BusinessMetrics;
    businessStats?: BusinessStats;
    // Movement removed - it's global only (same across all industries)
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
    // customerImages and staffNamePool removed - they're global only
  },
): Promise<{ success: boolean; message?: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const { data: existing } = await supabase
    .from('industry_simulation_config')
    .select('id')
    .eq('industry_id', industryId)
    .maybeSingle();

  const idToUse = existing?.id ?? `config-${industryId}`;

  const payload: any = {
    id: idToUse,
    industry_id: industryId,
  };

  if (config.businessMetrics !== undefined) payload.business_metrics = config.businessMetrics;
  if (config.businessStats !== undefined) payload.business_stats = config.businessStats;
  
  // Save map config to separate columns (preferred) or fallback to map_config JSONB
  if (config.mapWidth !== undefined) payload.map_width = config.mapWidth;
  if (config.mapHeight !== undefined) payload.map_height = config.mapHeight;
  if (config.mapWalls !== undefined) payload.map_walls = config.mapWalls;
  if (config.mapConfig !== undefined) payload.map_config = config.mapConfig; // Fallback for old code
  
  // Save layout to separate columns (preferred) or fallback to layoutConfig JSONB
  if (config.entryPosition !== undefined) payload.entry_position = config.entryPosition;
  if (config.waitingPositions !== undefined) payload.waiting_positions = config.waitingPositions;
  if (config.serviceRoomPositions !== undefined) payload.service_room_positions = config.serviceRoomPositions;
  if (config.staffPositions !== undefined) payload.staff_positions = config.staffPositions;
  if (config.layoutConfig !== undefined) payload.layout_config = config.layoutConfig; // Fallback for old code
  
  if (config.capacityImage !== undefined) payload.capacity_image = config.capacityImage;
  if (config.winCondition !== undefined) payload.win_condition = config.winCondition;
  if (config.loseCondition !== undefined) payload.lose_condition = config.loseCondition;
  // customerImages and staffNamePool removed - they're global only

  const { error } = await supabase
    .from('industry_simulation_config')
    .upsert(payload, { onConflict: 'industry_id' });

  if (error) {
    console.error('Failed to upsert industry simulation config:', error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

