/**
 * Layout positions repository
 * Fetches staff positions and service room positions from database
 * Reads from industry_simulation_config separate columns (entry_position, waiting_positions, service_rooms, staff_positions)
 */

import { supabase } from '@/lib/supabase/client';
import { GridPosition, IndustryId, AnchorPoint, ServiceRoomConfig } from '@/lib/game/types';
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
 * Validate and parse service rooms from JSONB
 */
export function parseServiceRooms(data: unknown): ServiceRoomConfig[] | null {
  if (!Array.isArray(data)) {
    return null;
  }
  
  const rooms: ServiceRoomConfig[] = [];
  for (const item of data) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'roomId' in item &&
      'customerPosition' in item &&
      'staffPosition' in item &&
      typeof (item as any).roomId === 'number'
    ) {
      const customerPos = parsePositions([(item as any).customerPosition]);
      const staffPos = parsePositions([(item as any).staffPosition]);
      
      if (customerPos && customerPos.length > 0 && staffPos && staffPos.length > 0) {
        rooms.push({
          roomId: (item as any).roomId,
          customerPosition: customerPos[0],
          staffPosition: staffPos[0],
        });
      }
    }
  }
  
  return rooms.length > 0 ? rooms : null;
}

/**
 * Fetch layout config from industry_simulation_config
 * Reads from separate columns (entry_position, waiting_positions, service_rooms, staff_positions)
 */
async function fetchLayoutConfigFromDatabase(
  industryId: IndustryId,
): Promise<SimulationLayoutConfig | null> {
  if (!supabase) {
    return null;
  }

  // Try industry_simulation_config first - use separate columns
  const { data: industryData, error: industryError } = await supabase
    .from('industry_simulation_config')
    .select('entry_position, waiting_positions, service_rooms, staff_positions')
    .eq('industry_id', industryId)
    .maybeSingle();

  if (!industryError && industryData) {
    if (industryData.entry_position || industryData.waiting_positions || industryData.service_rooms || industryData.staff_positions) {
      const serviceRooms = parseServiceRooms(industryData.service_rooms) || [];
      const layout: SimulationLayoutConfig = {
        entryPosition: (industryData.entry_position as unknown as { x: number; y: number }) || { x: 0, y: 0 },
        waitingPositions: parsePositions(industryData.waiting_positions) || [],
        serviceRooms,
        staffPositions: parsePositions(industryData.staff_positions) || [],
      };
      
      return layout;
    }
  }

  // Fallback to global config
  const { data: globalData, error: globalError } = await supabase
    .from('global_simulation_config')
    .select('entry_position, waiting_positions, service_rooms, staff_positions')
    .limit(1)
    .maybeSingle();

  if (!globalError && globalData) {
    if (globalData.entry_position || globalData.waiting_positions || globalData.service_rooms || globalData.staff_positions) {
      const serviceRooms = parseServiceRooms(globalData.service_rooms) || [];
      const layout: SimulationLayoutConfig = {
        entryPosition: (globalData.entry_position as unknown as { x: number; y: number }) || { x: 0, y: 0 },
        waitingPositions: parsePositions(globalData.waiting_positions) || [],
        serviceRooms,
        staffPositions: parsePositions(globalData.staff_positions) || [],
      };
      
      return layout;
    }
  }

  return null;
}

/**
 * Fetch staff positions for an industry from database
 * Reads from industry_simulation_config.staff_positions column
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
 * Reads from industry_simulation_config.service_rooms column
 * Returns null if not found or error
 */
export async function fetchServiceRoomPositionsFromDatabase(
  industryId: IndustryId,
): Promise<GridPosition[] | null> {
  const layout = await fetchLayoutConfigFromDatabase(industryId);
  if (!layout || !layout.serviceRooms || layout.serviceRooms.length === 0) {
    return null;
  }
  
  return layout.serviceRooms.map(room => room.customerPosition);
}

