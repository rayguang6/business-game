/**
 * Layout positions parsing utilities
 * Parses layout data from JSONB columns in industry_simulation_config
 * Note: Layout fetching is handled by industrySimulationConfigRepository.ts
 */

import { GridPosition, AnchorPoint, ServiceRoomConfig } from '@/lib/game/types';

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
 * Parse a single GridPosition (for main character position)
 * Handles both object format (from JSONB) and array format
 */
export function parsePosition(data: unknown): GridPosition | null {
  if (!data) {
    return null;
  }
  
  // If it's already an object with x and y, parse it directly
  if (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    'x' in data &&
    'y' in data &&
    typeof (data as any).x === 'number' &&
    typeof (data as any).y === 'number'
  ) {
    const position: GridPosition = { x: (data as any).x, y: (data as any).y };
    // Parse optional facingDirection if present
    if ('facingDirection' in data && typeof (data as any).facingDirection === 'string') {
      const facing = (data as any).facingDirection;
      if (facing === 'down' || facing === 'left' || facing === 'up' || facing === 'right') {
        position.facingDirection = facing;
      }
    }
    // Parse optional width if present
    if ('width' in data && typeof (data as any).width === 'number' && (data as any).width > 0) {
      position.width = (data as any).width;
    }
    // Parse optional height if present
    if ('height' in data && typeof (data as any).height === 'number' && (data as any).height > 0) {
      position.height = (data as any).height;
    }
    // Parse optional anchor if present
    if ('anchor' in data && typeof (data as any).anchor === 'string') {
      const anchor = (data as any).anchor;
      const validAnchors: AnchorPoint[] = [
        'top-left', 'top-center', 'top-right',
        'center-left', 'center', 'center-right',
        'bottom-left', 'bottom-center', 'bottom-right'
      ];
      if (validAnchors.includes(anchor as AnchorPoint)) {
        position.anchor = anchor as AnchorPoint;
      }
    }
    return position;
  }
  
  // Otherwise, try wrapping in array (for backward compatibility)
  const positions = parsePositions([data]);
  return positions && positions.length > 0 ? positions[0] : null;
}

