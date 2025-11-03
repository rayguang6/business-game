/**
 * Customer positioning system
 * Provides industry-aware accessors for layout positions.
 * 
 * Now supports reading positions from database with fallback to hardcoded config.
 *
 * TODO: Once all callers pass the explicit industry id,
 * drop the default argument and require the caller to choose.
 */

import { DEFAULT_INDUSTRY_ID, getLayoutConfig } from '@/lib/game/config';
import { GridPosition, IndustryId } from '@/lib/game/types';
import {
  fetchStaffPositionsFromDatabase,
  fetchServiceRoomPositionsFromDatabase,
} from '@/lib/data/layoutRepository';

// Cache to avoid repeated database calls
const positionCache = new Map<string, {
  staffPositions?: GridPosition[] | null;
  serviceRoomPositions?: GridPosition[] | null;
  timestamp: number;
}>();

const CACHE_TTL = 60000; // 1 minute cache

function getCachedOrFetch(
  cacheKey: string,
  fetchFn: () => Promise<GridPosition[] | null>,
  field: 'staffPositions' | 'serviceRoomPositions',
): Promise<GridPosition[] | null> {
  const cached = positionCache.get(cacheKey);
  const now = Date.now();
  
  // Return cached if valid
  if (cached && (now - cached.timestamp) < CACHE_TTL && cached[field] !== undefined) {
    return Promise.resolve(cached[field]);
  }
  
  // Fetch and cache
  return fetchFn().then((result) => {
    const existing = positionCache.get(cacheKey) || { timestamp: now };
    existing[field] = result;
    existing.timestamp = now;
    positionCache.set(cacheKey, existing);
    return result;
  });
}

export function getWaitingPositions(industryId: IndustryId): GridPosition[] {
  return getLayoutConfig(industryId).waitingPositions;
}

/**
 * Get service room positions from database, fallback to hardcoded config
 */
export async function getServiceRoomPositions(
  industryId: IndustryId,
): Promise<GridPosition[]> {
  // Try database first
  const dbPositions = await getCachedOrFetch(
    industryId,
    () => fetchServiceRoomPositionsFromDatabase(industryId),
    'serviceRoomPositions',
  );
  
  // Use database positions if available, otherwise fallback to hardcoded
  if (dbPositions && dbPositions.length > 0) {
    return dbPositions;
  }
  
  // Fallback to hardcoded config
  return getLayoutConfig(industryId).serviceRoomPositions;
}

/**
 * Get staff positions from database, fallback to hardcoded config
 */
export async function getStaffPositions(
  industryId: IndustryId,
): Promise<GridPosition[]> {
  // Try database first
  const dbPositions = await getCachedOrFetch(
    industryId,
    () => fetchStaffPositionsFromDatabase(industryId),
    'staffPositions',
  );
  
  // Use database positions if available, otherwise fallback to hardcoded
  if (dbPositions && dbPositions.length > 0) {
    return dbPositions;
  }
  
  // Fallback to hardcoded config
  return getLayoutConfig(industryId).staffPositions;
}

/**
 * Synchronous version for backward compatibility (uses hardcoded only)
 * Use async versions for database support
 */
export function getServiceRoomPositionsSync(industryId: IndustryId): GridPosition[] {
  return getLayoutConfig(industryId).serviceRoomPositions;
}

export function getStaffPositionsSync(industryId: IndustryId): GridPosition[] {
  return getLayoutConfig(industryId).staffPositions;
}

export function getEntryPosition(industryId: IndustryId): GridPosition {
  return getLayoutConfig(industryId).entryPosition;
}

/**
 * Get an available waiting position based on current customers.
 * Falls back to the default industry layout if the requested id is unknown.
 */
export function getAvailableWaitingPosition(
  occupiedPositions: GridPosition[],
  industryId: IndustryId,
): GridPosition | null {
  const waitingPositions = getWaitingPositions(industryId);
  for (const position of waitingPositions) {
    const isOccupied = occupiedPositions.some(
      (occupied) => occupied.x === position.x && occupied.y === position.y,
    );
    if (!isOccupied) {
      return position;
    }
  }
  return null;
}

/**
 * Get service room position based on room ID (1-based).
 */
/**
 * Get service room position based on room ID (1-based).
 * Uses sync version for backward compatibility with synchronous contexts.
 */
export function getServiceRoomPosition(
  roomId: number,
  industryId: IndustryId,
): GridPosition | null {
  const positions = getServiceRoomPositionsSync(industryId);
  return positions[roomId - 1] ?? null;
}

/**
 * Get waiting position based on index (for assigning to customers in order).
 */
export function getWaitingPositionByIndex(
  index: number,
  industryId: IndustryId,
): GridPosition | null {
  const positions = getWaitingPositions(industryId);
  return positions[index] ?? null;
}

// Backwards-compatible constants for existing callers (use sync versions).
export const WAITING_POSITIONS = getWaitingPositions(DEFAULT_INDUSTRY_ID);
export const SERVICE_ROOM_POSITIONS = getServiceRoomPositionsSync(DEFAULT_INDUSTRY_ID);
export const ENTRY_POSITION = getEntryPosition(DEFAULT_INDUSTRY_ID);
