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
import { GridPosition, IndustryId, ServiceRoomConfig } from '@/lib/game/types';

export function getWaitingPositions(industryId: IndustryId): GridPosition[] {
  const layout = getLayoutConfig(industryId);
  if (!layout) {
    throw new Error(`Layout config not loaded for industry "${industryId}". Please configure layout in the admin panel.`);
  }
  return layout.waitingPositions;
}

export function getServiceRoomPositions(industryId: IndustryId): GridPosition[] {
  const layout = getLayoutConfig(industryId);
  if (!layout) {
    throw new Error(`Layout config not loaded for industry "${industryId}". Please configure layout in the admin panel.`);
  }
  return layout.serviceRooms.map(room => room.customerPosition);
}

export function getStaffPositions(industryId: IndustryId): GridPosition[] {
  const layout = getLayoutConfig(industryId);
  if (!layout) {
    throw new Error(`Layout config not loaded for industry "${industryId}". Please configure layout in the admin panel.`);
  }
  
  return layout.staffPositions;
}

export function getEntryPosition(industryId: IndustryId): GridPosition {
  const layout = getLayoutConfig(industryId);
  if (!layout) {
    throw new Error(`Layout config not loaded for industry "${industryId}". Please configure layout in the admin panel.`);
  }
  return layout.entryPosition;
}

/**
 * Get all service rooms (structured format)
 */
export function getServiceRooms(industryId: IndustryId): ServiceRoomConfig[] {
  const layout = getLayoutConfig(industryId);
  if (!layout) {
    throw new Error(`Layout config not loaded for industry "${industryId}". Please configure layout in the admin panel.`);
  }
  
  return layout.serviceRooms;
}

/**
 * Get a specific service room by room ID (1-based)
 */
export function getServiceRoom(roomId: number, industryId: IndustryId): ServiceRoomConfig | null {
  const rooms = getServiceRooms(industryId);
  return rooms.find(room => room.roomId === roomId) || null;
}

/**
 * Get customer position for a specific service room (1-based room ID)
 */
export function getServiceCustomerPosition(roomId: number, industryId: IndustryId): GridPosition | null {
  const room = getServiceRoom(roomId, industryId);
  return room?.customerPosition || null;
}

/**
 * Get staff position for a specific service room (1-based room ID)
 */
export function getServiceStaffPosition(roomId: number, industryId: IndustryId): GridPosition | null {
  const room = getServiceRoom(roomId, industryId);
  return room?.staffPosition || null;
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
 * Legacy function - now uses structured service rooms internally.
 * Returns customer position for backward compatibility.
 */
export function getServiceRoomPosition(
  roomId: number,
  industryId: IndustryId,
): GridPosition | null {
  return getServiceCustomerPosition(roomId, industryId);
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

// Backwards-compatible constants for existing callers (lazy evaluation to avoid module load errors)
// These will throw errors at runtime if layout is not loaded, which is correct behavior
export function getWAITING_POSITIONS(): GridPosition[] {
  return getWaitingPositions(DEFAULT_INDUSTRY_ID);
}

export function getSERVICE_ROOM_POSITIONS(): GridPosition[] {
  return getServiceRoomPositions(DEFAULT_INDUSTRY_ID);
}

export function getENTRY_POSITION(): GridPosition {
  return getEntryPosition(DEFAULT_INDUSTRY_ID);
}

// Legacy constants - use getters above instead
// @deprecated Use getWAITING_POSITIONS() instead
export const WAITING_POSITIONS: GridPosition[] = [];
// @deprecated Use getSERVICE_ROOM_POSITIONS() instead  
export const SERVICE_ROOM_POSITIONS: GridPosition[] = [];
// @deprecated Use getENTRY_POSITION() instead
export const ENTRY_POSITION: GridPosition = { x: 0, y: 0 };
