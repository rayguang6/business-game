/**
 * Customer positioning system
 * Manages hardcoded positions for waiting area and service rooms
 */

export interface GridPosition {
  x: number;
  y: number;
}

// Waiting area positions (8 spots total)
//TODO: Extract To Config
export const WAITING_POSITIONS: GridPosition[] = [
  { x: 1, y: 1 },
  { x: 1, y: 2 },
  { x: 1, y: 3 },
  { x: 1, y: 4 },
  { x: 1, y: 5 },
  { x: 1, y: 6 },
  { x: 1, y: 7 },
  { x: 1, y: 8 },
];

// Service room positions (5 spots total)
//TODO: Extract To Config
export const SERVICE_ROOM_POSITIONS: GridPosition[] = [
  { x: 5, y: 2 },
  { x: 6, y: 2 },
  { x: 7, y: 2 },
  { x: 8, y: 2 },
  { x: 9, y: 2 },
];

//TODO: Extract To Config
// Entry spawn position (where customers first appear)
export const ENTRY_POSITION: GridPosition = { x: 4, y: 9 };

/**
 * Get an available waiting position based on current customers
 */
export function getAvailableWaitingPosition(occupiedPositions: GridPosition[]): GridPosition | null {
  for (const position of WAITING_POSITIONS) {
    const isOccupied = occupiedPositions.some(
      (occupied) => occupied.x === position.x && occupied.y === position.y
    );
    if (!isOccupied) {
      return position;
    }
  }
  return null; // All waiting positions are occupied
}

/**
 * Get service room position based on room ID (1-based)
 */
export function getServiceRoomPosition(roomId: number): GridPosition | null {
  // roomId is 1-based, array is 0-based
  const position = SERVICE_ROOM_POSITIONS[roomId - 1];
  return position || null;
}

/**
 * Get waiting position based on index (for assigning to customers in order)
 */
export function getWaitingPositionByIndex(index: number): GridPosition | null {
  return WAITING_POSITIONS[index] || null;
}

