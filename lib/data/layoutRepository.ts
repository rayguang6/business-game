/**
 * Layout positions repository
 * Fetches staff positions and service room positions from database
 */

import { supabase } from '@/lib/supabase/client';
import { GridPosition, IndustryId } from '@/lib/game/types';

interface IndustryLayoutRow {
  id: string;
  staff_positions?: unknown; // JSONB: GridPosition[]
  service_room_positions?: unknown; // JSONB: GridPosition[]
}

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
 * Fetch staff positions for an industry from database
 * Returns null if not found or error
 */
export async function fetchStaffPositionsFromDatabase(
  industryId: IndustryId,
): Promise<GridPosition[] | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('industries')
    .select('staff_positions')
    .eq('id', industryId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parsePositions(data.staff_positions);
}

/**
 * Fetch service room positions for an industry from database
 * Returns null if not found or error
 */
export async function fetchServiceRoomPositionsFromDatabase(
  industryId: IndustryId,
): Promise<GridPosition[] | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('industries')
    .select('service_room_positions')
    .eq('id', industryId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parsePositions(data.service_room_positions);
}

