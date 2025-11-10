/**
 * Layout positions repository
 * Fetches staff positions and service room positions from database
 * Now reads from industry_simulation_config.layout_config
 */

import { supabase } from '@/lib/supabase/client';
import { GridPosition, IndustryId } from '@/lib/game/types';
import type { SimulationLayoutConfig } from '@/lib/game/types';

/**
 * Validate and parse positions from JSONB
 */
function parsePositions(data: unknown): GridPosition[] | null {
  if (!Array.isArray(data)) {
    return null;
  }
  
  // Validate that all items have x and y properties
  const positions: GridPosition[] = [];
  for (const item of data) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'x' in item &&
      'y' in item &&
      typeof (item as any).x === 'number' &&
      typeof (item as any).y === 'number'
    ) {
      positions.push({ x: (item as any).x, y: (item as any).y });
    }
  }
  
  return positions.length > 0 ? positions : null;
}

/**
 * Fetch layout config from industry_simulation_config
 * Now reads from separate columns (entry_position, waiting_positions, etc.)
 * Falls back to layout_config column for backward compatibility
 */
async function fetchLayoutConfigFromDatabase(
  industryId: IndustryId,
): Promise<SimulationLayoutConfig | null> {
  if (!supabase) {
    return null;
  }

  // Try industry_simulation_config first - use separate columns (preferred)
  const { data: industryData, error: industryError } = await supabase
    .from('industry_simulation_config')
    .select('entry_position, waiting_positions, service_room_positions, staff_positions, layout_config')
    .eq('industry_id', industryId)
    .maybeSingle();

  if (!industryError && industryData) {
    // Prefer separate columns if they exist
    if (industryData.entry_position || industryData.waiting_positions || industryData.service_room_positions || industryData.staff_positions) {
      const layout: SimulationLayoutConfig = {
        entryPosition: (industryData.entry_position as unknown as { x: number; y: number }) || { x: 0, y: 0 },
        waitingPositions: parsePositions(industryData.waiting_positions) || [],
        serviceRoomPositions: parsePositions(industryData.service_room_positions) || [],
        staffPositions: parsePositions(industryData.staff_positions) || [],
      };
      return layout;
    }
    
    // Fallback to layout_config column for backward compatibility
    if (industryData.layout_config) {
      const layout = industryData.layout_config as unknown as SimulationLayoutConfig;
      if (
        layout.entryPosition &&
        typeof layout.entryPosition.x === 'number' &&
        typeof layout.entryPosition.y === 'number' &&
        Array.isArray(layout.waitingPositions) &&
        Array.isArray(layout.serviceRoomPositions) &&
        Array.isArray(layout.staffPositions)
      ) {
        return layout;
      }
    }
  }

  // Fallback to global config
  const { data: globalData, error: globalError } = await supabase
    .from('global_simulation_config')
    .select('entry_position, waiting_positions, service_room_positions, staff_positions, layout_config')
    .limit(1)
    .maybeSingle();

  if (!globalError && globalData) {
    // Prefer separate columns if they exist
    if (globalData.entry_position || globalData.waiting_positions || globalData.service_room_positions || globalData.staff_positions) {
      const layout: SimulationLayoutConfig = {
        entryPosition: (globalData.entry_position as unknown as { x: number; y: number }) || { x: 0, y: 0 },
        waitingPositions: parsePositions(globalData.waiting_positions) || [],
        serviceRoomPositions: parsePositions(globalData.service_room_positions) || [],
        staffPositions: parsePositions(globalData.staff_positions) || [],
      };
      return layout;
    }
    
    // Fallback to layout_config column for backward compatibility
    if (globalData.layout_config) {
      const layout = globalData.layout_config as unknown as SimulationLayoutConfig;
      if (
        layout.entryPosition &&
        typeof layout.entryPosition.x === 'number' &&
        typeof layout.entryPosition.y === 'number' &&
        Array.isArray(layout.waitingPositions) &&
        Array.isArray(layout.serviceRoomPositions) &&
        Array.isArray(layout.staffPositions)
      ) {
        return layout;
      }
    }
  }

  return null;
}

/**
 * Fetch staff positions for an industry from database
 * Now reads from industry_simulation_config.layout_config.staffPositions
 * Returns null if not found or error
 */
export async function fetchStaffPositionsFromDatabase(
  industryId: IndustryId,
): Promise<GridPosition[] | null> {
  const layout = await fetchLayoutConfigFromDatabase(industryId);
  if (layout?.staffPositions) {
    return layout.staffPositions;
  }
  return null;
}

/**
 * Fetch service room positions for an industry from database
 * Now reads from industry_simulation_config.layout_config.serviceRoomPositions
 * Returns null if not found or error
 */
export async function fetchServiceRoomPositionsFromDatabase(
  industryId: IndustryId,
): Promise<GridPosition[] | null> {
  const layout = await fetchLayoutConfigFromDatabase(industryId);
  if (layout?.serviceRoomPositions) {
    return layout.serviceRoomPositions;
  }
  return null;
}

