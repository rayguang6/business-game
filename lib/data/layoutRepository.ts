/**
 * Layout positions repository
 * Fetches staff positions and service room positions from database
 * Now reads from industry_simulation_config.layout_config
 */

import { supabase } from '@/lib/supabase/client';
import { GridPosition, IndustryId, AnchorPoint } from '@/lib/game/types';
import type { SimulationLayoutConfig } from '@/lib/game/types';

/**
 * Validate and parse positions from JSONB
 */
export function parsePositions(data: unknown): GridPosition[] | null {
  if (!Array.isArray(data)) {
    return null;
  }
  
  // Validate that all items have x and y properties
  // Also parse optional facingDirection, width, height, and anchor if present
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
      const position: GridPosition = { x: (item as any).x, y: (item as any).y };
      // Parse optional facingDirection if present
      if ('facingDirection' in item && typeof (item as any).facingDirection === 'string') {
        const facing = (item as any).facingDirection;
        if (facing === 'down' || facing === 'left' || facing === 'up' || facing === 'right') {
          position.facingDirection = facing;
        }
      }
      // Parse optional width if present
      if ('width' in item && typeof (item as any).width === 'number' && (item as any).width > 0) {
        position.width = (item as any).width;
      }
      // Parse optional height if present
      if ('height' in item && typeof (item as any).height === 'number' && (item as any).height > 0) {
        position.height = (item as any).height;
      }
      // Parse optional anchor if present
      if ('anchor' in item && typeof (item as any).anchor === 'string') {
        const anchor = (item as any).anchor;
        const validAnchors: AnchorPoint[] = [
          'top-left', 'top-center', 'top-right',
          'center-left', 'center', 'center-right',
          'bottom-left', 'bottom-center', 'bottom-right'
        ];
        if (validAnchors.includes(anchor as AnchorPoint)) {
          position.anchor = anchor as AnchorPoint;
        }
      }
      positions.push(position);
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

