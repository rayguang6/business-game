import { supabaseServer } from '@/lib/server/supabaseServer';
import type { BusinessMetrics, BusinessStats, MovementConfig, MapConfig, SimulationLayoutConfig } from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';
import type { IndustryId } from '@/lib/game/types';

export interface SimulationConfigRow {
  industry_id: string;
  business_metrics: BusinessMetrics | null;
  business_stats: BusinessStats | null;
  movement: MovementConfig | null;
  map_width: number | null;
  map_height: number | null;
  map_walls: Array<{ x: number; y: number }> | null;
  entry_position: { x: number; y: number } | null;
  waiting_positions: Array<{ x: number; y: number }> | null;
  service_rooms: Array<{ roomId: number; customerPosition: { x: number; y: number }; staffPosition: { x: number; y: number } }> | null;
  staff_positions: Array<{ x: number; y: number }> | null;
  main_character_position: { x: number; y: number } | null;
  main_character_sprite_image: string | null;
  win_condition: WinCondition | null;
  lose_condition: LoseCondition | null;
  event_selection_mode: 'random' | 'sequence' | null;
  event_sequence: string[] | null;
  capacity_image: string | null;
  customer_images: string[] | null;
  staff_name_pool: string[] | null;
  lead_dialogues: string[] | null;
  ui_config: { event_auto_select_duration_seconds?: number; outcome_popup_duration_seconds?: number } | null;
  created_at: string;
  updated_at: string;
}

export interface SimulationConfigResult {
  businessMetrics?: BusinessMetrics;
  businessStats?: BusinessStats;
  movement?: MovementConfig;
  mapConfig?: MapConfig;
  layoutConfig?: SimulationLayoutConfig;
  winCondition?: WinCondition;
  loseCondition?: LoseCondition;
  eventSelectionMode?: 'random' | 'sequence';
  eventSequence?: string[];
  capacityImage?: string;
  customerImages?: string[];
  staffNamePool?: string[];
  leadDialogues?: string[];
  uiConfig?: {
    eventAutoSelectDurationSeconds?: number;
    outcomePopupDurationSeconds?: number;
  };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const mapBusinessMetrics = (raw: unknown): BusinessMetrics | undefined => {
  if (!isObject(raw)) return undefined;
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
      startingExp: candidate.startingExp,
      startingFreedomScore: candidate.startingFreedomScore,
    };
  }
  return undefined;
};

const mapBusinessStats = (raw: unknown): BusinessStats | undefined => {
  if (!isObject(raw)) return undefined;
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
  if (!isObject(raw)) return undefined;
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
  if (!isObject(raw)) return undefined;
  const candidate = raw as unknown as WinCondition;
  if (typeof candidate.cashTarget === 'number') {
    return {
      cashTarget: candidate.cashTarget,
      monthTarget: typeof candidate.monthTarget === 'number' ? candidate.monthTarget : undefined,
      customTitle: typeof candidate.customTitle === 'string' ? candidate.customTitle : undefined,
      customMessage: typeof candidate.customMessage === 'string' ? candidate.customMessage : undefined,
    };
  }
  return undefined;
};

const mapLoseCondition = (raw: unknown): LoseCondition | undefined => {
  if (!isObject(raw)) return undefined;
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

const mapUiConfig = (raw: unknown): { eventAutoSelectDurationSeconds?: number; outcomePopupDurationSeconds?: number } | undefined => {
  if (!isObject(raw)) return undefined;
  const candidate = raw as unknown as { event_auto_select_duration_seconds?: number; outcome_popup_duration_seconds?: number };
  const result: { eventAutoSelectDurationSeconds?: number; outcomePopupDurationSeconds?: number } = {};

  if (typeof candidate.event_auto_select_duration_seconds === 'number') {
    result.eventAutoSelectDurationSeconds = candidate.event_auto_select_duration_seconds;
  }
  if (typeof candidate.outcome_popup_duration_seconds === 'number') {
    result.outcomePopupDurationSeconds = candidate.outcome_popup_duration_seconds;
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

/**
 * Fetch simulation config for an industry (merges global defaults + industry overrides)
 * @param industryId - The industry ID to fetch config for
 * @returns Merged config result or null if not found
 */
export async function fetchSimulationConfig(industryId: IndustryId): Promise<SimulationConfigResult | null> {
  if (!supabaseServer) {
    console.error('Supabase client not configured. Unable to fetch simulation config.');
    return null;
  }

  // Fetch both global defaults and industry-specific overrides in parallel
  const [globalResult, industryResult] = await Promise.all([
    supabaseServer
      .from('simulation_config')
      .select('*')
      .eq('industry_id', 'global')
      .maybeSingle(),
    supabaseServer
      .from('simulation_config')
      .select('*')
      .eq('industry_id', industryId)
      .maybeSingle()
  ]);

  if (globalResult.error) {
    console.error('[SimulationConfig] Failed to fetch global config:', globalResult.error);
    return null;
  }

  if (industryResult.error) {
    console.error(`[SimulationConfig] Failed to fetch config for industry "${industryId}":`, industryResult.error);
    return null;
  }

  const globalRow = globalResult.data as SimulationConfigRow | null;
  const industryRow = industryResult.data as SimulationConfigRow | null;

  // If no data at all, return null
  if (!globalRow && !industryRow) {
    return null;
  }

  const result: SimulationConfigResult = {};

  // Helper to merge config values (industry overrides global)
  const mergeConfig = <T>(globalValue: T | null | undefined, industryValue: T | null | undefined): T | undefined => {
    return industryValue !== null && industryValue !== undefined ? industryValue : globalValue || undefined;
  };

  // Business metrics (merge objects)
  const globalMetrics = globalRow?.business_metrics ? mapBusinessMetrics(globalRow.business_metrics) : undefined;
  const industryMetrics = industryRow?.business_metrics ? mapBusinessMetrics(industryRow.business_metrics) : undefined;
  if (globalMetrics || industryMetrics) {
    result.businessMetrics = { ...globalMetrics, ...industryMetrics } as BusinessMetrics;
  } else {
    result.businessMetrics = undefined;
  }

  // Business stats (merge objects)
  const globalStats = globalRow?.business_stats ? mapBusinessStats(globalRow.business_stats) : undefined;
  const industryStats = industryRow?.business_stats ? mapBusinessStats(industryRow.business_stats) : undefined;
  if (globalStats || industryStats) {
    const mergedStats = { ...globalStats, ...industryStats };
    // Handle eventTriggerSeconds array merging
    if (industryStats?.eventTriggerSeconds || globalStats?.eventTriggerSeconds) {
      mergedStats.eventTriggerSeconds = industryStats?.eventTriggerSeconds || globalStats?.eventTriggerSeconds;
    }
    result.businessStats = mergedStats as BusinessStats;
  } else {
    result.businessStats = undefined;
  }

  // Movement (global only)
  if (globalRow?.movement) {
    result.movement = mapMovementConfig(globalRow.movement) || undefined;
  }

  // Map config (merge from separate columns)
  const mapWidth = mergeConfig(globalRow?.map_width, industryRow?.map_width);
  const mapHeight = mergeConfig(globalRow?.map_height, industryRow?.map_height);
  const mapWalls = mergeConfig(globalRow?.map_walls, industryRow?.map_walls);

  if (mapWidth || mapHeight || mapWalls) {
    result.mapConfig = {
      width: mapWidth || 10,
      height: mapHeight || 10,
      walls: mapWalls || [],
    };
  }

  // Layout config (industry-specific only)
  if (industryRow) {
    const hasLayoutData = Boolean(industryRow.entry_position ||
                         industryRow.waiting_positions ||
                         industryRow.service_rooms ||
                         industryRow.staff_positions ||
                         industryRow.main_character_position ||
                         industryRow.main_character_sprite_image);

    if (hasLayoutData) {
      // Helper to safely parse JSONB fields that might be strings
      const safeParse = (value: any) => {
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
      };

      const layoutConfig: SimulationLayoutConfig = {
        entryPosition: safeParse(industryRow.entry_position) || { x: 0, y: 0 },
        waitingPositions: Array.isArray(safeParse(industryRow.waiting_positions)) ? safeParse(industryRow.waiting_positions) : [],
        serviceRooms: Array.isArray(safeParse(industryRow.service_rooms)) ? safeParse(industryRow.service_rooms) : [],
        staffPositions: Array.isArray(safeParse(industryRow.staff_positions)) ? safeParse(industryRow.staff_positions) : [],
        mainCharacterPosition: safeParse(industryRow.main_character_position) || undefined,
        mainCharacterSpriteImage: industryRow.main_character_sprite_image || undefined,
      };
      result.layoutConfig = layoutConfig;
    }
  }

  // Game conditions
  const winCondition = mergeConfig(
    globalRow?.win_condition ? mapWinCondition(globalRow.win_condition) : undefined,
    industryRow?.win_condition ? mapWinCondition(industryRow.win_condition) : undefined
  );
  if (winCondition) result.winCondition = winCondition;

  const loseCondition = mergeConfig(
    globalRow?.lose_condition ? mapLoseCondition(globalRow.lose_condition) : undefined,
    industryRow?.lose_condition ? mapLoseCondition(industryRow.lose_condition) : undefined
  );
  if (loseCondition) result.loseCondition = loseCondition;

  // Event configuration (industry-specific)
  if (industryRow?.event_selection_mode) {
    result.eventSelectionMode = industryRow.event_selection_mode;
  }
  if (industryRow?.event_sequence) {
    result.eventSequence = industryRow.event_sequence;
  }

  // UI/Media configuration
  const capacityImage = mergeConfig(globalRow?.capacity_image, industryRow?.capacity_image);
  if (capacityImage) result.capacityImage = capacityImage;

  const customerImages = mergeConfig(globalRow?.customer_images, industryRow?.customer_images);
  if (customerImages) result.customerImages = customerImages;

  const staffNamePool = mergeConfig(globalRow?.staff_name_pool, industryRow?.staff_name_pool);
  if (staffNamePool) result.staffNamePool = staffNamePool;

  const leadDialogues = mergeConfig(globalRow?.lead_dialogues, industryRow?.lead_dialogues);
  if (leadDialogues) result.leadDialogues = leadDialogues;

  const uiConfig = mergeConfig(
    globalRow?.ui_config ? mapUiConfig(globalRow.ui_config) : undefined,
    industryRow?.ui_config ? mapUiConfig(industryRow.ui_config) : undefined
  );
  if (uiConfig) result.uiConfig = uiConfig;

  return result;
}

/**
 * Upsert simulation config for an industry
 */
export async function upsertSimulationConfig(
  industryId: IndustryId,
  config: {
    businessMetrics?: BusinessMetrics;
    businessStats?: BusinessStats;
    movement?: MovementConfig;
    mapConfig?: MapConfig;
    mapWidth?: number | null;
    mapHeight?: number | null;
    mapWalls?: Array<{ x: number; y: number }> | null;
    layoutConfig?: SimulationLayoutConfig;
    entryPosition?: { x: number; y: number } | null;
    waitingPositions?: Array<{ x: number; y: number }> | null;
    serviceRooms?: Array<{ roomId: number; customerPosition: { x: number; y: number }; staffPosition: { x: number; y: number } }> | null;
    staffPositions?: Array<{ x: number; y: number }> | null;
    mainCharacterPosition?: { x: number; y: number } | null;
    mainCharacterSpriteImage?: string | null;
    winCondition?: WinCondition;
    loseCondition?: LoseCondition;
    eventSelectionMode?: 'random' | 'sequence';
    eventSequence?: string[];
    capacityImage?: string | null;
    customerImages?: string[] | null;
    staffNamePool?: string[] | null;
    leadDialogues?: string[] | null;
    uiConfig?: {
      eventAutoSelectDurationSeconds?: number;
      outcomePopupDurationSeconds?: number;
    };
  }
): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Extract separate fields from mapConfig/layoutConfig if provided (for backward compatibility)
  const mapWidth = config.mapWidth ?? config.mapConfig?.width ?? undefined;
  const mapHeight = config.mapHeight ?? config.mapConfig?.height ?? undefined;
  const mapWalls = config.mapWalls ?? config.mapConfig?.walls ?? undefined;

  const entryPosition = config.entryPosition ?? config.layoutConfig?.entryPosition ?? undefined;
  const waitingPositions = config.waitingPositions ?? config.layoutConfig?.waitingPositions ?? undefined;
  const serviceRooms = config.serviceRooms ?? config.layoutConfig?.serviceRooms ?? undefined;
  const staffPositions = config.staffPositions ?? config.layoutConfig?.staffPositions ?? undefined;
  const mainCharacterPosition = config.mainCharacterPosition ?? config.layoutConfig?.mainCharacterPosition ?? undefined;
  const mainCharacterSpriteImage = config.mainCharacterSpriteImage ?? config.layoutConfig?.mainCharacterSpriteImage ?? undefined;

  // Prepare UI config for storage
  const uiConfigPayload = config.uiConfig ? {
    event_auto_select_duration_seconds: config.uiConfig.eventAutoSelectDurationSeconds,
    outcome_popup_duration_seconds: config.uiConfig.outcomePopupDurationSeconds,
  } : null;

  const payload: Partial<SimulationConfigRow> = {
    industry_id: industryId,
  };

  // Only include fields that are provided (not undefined)
  if (config.businessMetrics !== undefined) payload.business_metrics = config.businessMetrics;
  if (config.businessStats !== undefined) payload.business_stats = config.businessStats;
  if (config.movement !== undefined) payload.movement = config.movement;

  if (mapWidth !== undefined) payload.map_width = mapWidth;
  if (mapHeight !== undefined) payload.map_height = mapHeight;
  if (mapWalls !== undefined) payload.map_walls = mapWalls;

  if (entryPosition !== undefined) payload.entry_position = entryPosition;
  if (waitingPositions !== undefined) payload.waiting_positions = waitingPositions;
  if (serviceRooms !== undefined) payload.service_rooms = serviceRooms;
  if (staffPositions !== undefined) payload.staff_positions = staffPositions;
  if (mainCharacterPosition !== undefined) payload.main_character_position = mainCharacterPosition;
  if (mainCharacterSpriteImage !== undefined) {
    payload.main_character_sprite_image = mainCharacterSpriteImage && mainCharacterSpriteImage.trim()
      ? mainCharacterSpriteImage.trim()
      : null;
  }

  if (config.winCondition !== undefined) payload.win_condition = config.winCondition;
  if (config.loseCondition !== undefined) payload.lose_condition = config.loseCondition;

  if (config.eventSelectionMode !== undefined) payload.event_selection_mode = config.eventSelectionMode;
  if (config.eventSequence !== undefined) payload.event_sequence = config.eventSequence;

  if (config.capacityImage !== undefined) payload.capacity_image = config.capacityImage;
  if (config.customerImages !== undefined) payload.customer_images = config.customerImages;
  if (config.staffNamePool !== undefined) payload.staff_name_pool = config.staffNamePool;
  if (config.leadDialogues !== undefined) payload.lead_dialogues = config.leadDialogues;

  if (uiConfigPayload !== null) payload.ui_config = uiConfigPayload;

  const { error } = await supabaseServer
    .from('simulation_config')
    .upsert(payload, { onConflict: 'industry_id' });

  if (error) {
    console.error(`[SimulationConfig] Failed to upsert config for industry "${industryId}":`, error);
    return { success: false, message: `Failed to save config: ${error.message}` };
  }

  return { success: true };
}