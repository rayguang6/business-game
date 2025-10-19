/**
 * Customer positioning system
 * Provides industry-aware accessors for layout positions.
 *
 * TODO: Once all callers pass the explicit industry id,
 * drop the default argument and require the caller to choose.
 */

import { DEFAULT_INDUSTRY_ID, getLayoutConfig } from '@/lib/game/config';
import { GridPosition, IndustryId } from '@/lib/game/types';

export function getWaitingPositions(industryId: IndustryId): GridPosition[] {
  return getLayoutConfig(industryId).waitingPositions;
}

export function getServiceRoomPositions(industryId: IndustryId): GridPosition[] {
  return getLayoutConfig(industryId).serviceRoomPositions;
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
export function getServiceRoomPosition(
  roomId: number,
  industryId: IndustryId,
): GridPosition | null {
  const positions = getServiceRoomPositions(industryId);
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

// Backwards-compatible constants for existing callers.
export const WAITING_POSITIONS = getWaitingPositions(DEFAULT_INDUSTRY_ID);
export const SERVICE_ROOM_POSITIONS = getServiceRoomPositions(DEFAULT_INDUSTRY_ID);
export const ENTRY_POSITION = getEntryPosition(DEFAULT_INDUSTRY_ID);
