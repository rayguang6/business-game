import type { Staff } from './staff';
import type { GridPosition } from '@/lib/game/types';

/**
 * Main Character Interface
 *
 * The main character is always present in the game and uses the player's username.
 * It follows the same structure as Staff for compatibility with staff logic,
 * but is a separate entity that cannot be hired/fired.
 */
export interface MainCharacter extends Omit<Staff, 'salary' | 'effects' | 'setsFlag' | 'requirements'> {
  id: 'main-character'; // Fixed ID
  roleId: 'main-character'; // Fixed role ID
  role: string; // Dynamic role name
  // No salary, effects, setsFlag, or requirements - main character is always present
}

/**
 * Default sprite image for main character
 */
export const DEFAULT_MAIN_CHARACTER_SPRITE = '/images/staff/staff1.png';

/**
 * Get sprite image with proper fallback chain:
 * 1. Provided spriteImage
 * 2. Layout config spriteImage
 * 3. Default sprite
 */
export function getMainCharacterSprite(
  spriteImage?: string,
  layoutSpriteImage?: string,
): string {
  return spriteImage || layoutSpriteImage || DEFAULT_MAIN_CHARACTER_SPRITE;
}

/**
 * Create a main character from username
 * @param username - Player's username
 * @param options - Optional configuration
 * @param options.spriteImage - Sprite image path (takes precedence)
 * @param options.layoutSpriteImage - Sprite image from layout config (fallback)
 * @param options.position - Initial grid position (x, y, facingDirection)
 * @param options.role - Role name for the main character
 */
export function createMainCharacter(
  username: string,
  options?: {
    spriteImage?: string;
    layoutSpriteImage?: string;
    position?: GridPosition;
    role?: string;
  },
): MainCharacter {
  const spriteImage = getMainCharacterSprite(
    options?.spriteImage,
    options?.layoutSpriteImage,
  );

  const mainCharacter: MainCharacter = {
    id: 'main-character',
    name: username,
    roleId: 'main-character',
    role: options?.role || 'Main Character',
    spriteImage,
    status: 'idle',
  };

  // Initialize position from provided position or default to (0, 0)
  if (options?.position) {
    mainCharacter.x = options.position.x;
    mainCharacter.y = options.position.y;
    mainCharacter.facingDirection = options.position.facingDirection || 'down';
  } else {
    // Default position if none provided
    mainCharacter.x = 0;
    mainCharacter.y = 0;
    mainCharacter.facingDirection = 'down';
  }

  return mainCharacter;
}

/**
 * Update main character name when username changes
 * Preserves all other properties including position
 */
export function updateMainCharacterName(
  mainCharacter: MainCharacter,
  username: string,
): MainCharacter {
  return {
    ...mainCharacter,
    name: username,
  };
}

/**
 * Update main character position
 */
export function updateMainCharacterPosition(
  mainCharacter: MainCharacter,
  position: GridPosition,
): MainCharacter {
  return {
    ...mainCharacter,
    x: position.x,
    y: position.y,
    facingDirection: position.facingDirection || mainCharacter.facingDirection || 'down',
  };
}

/**
 * Check if a value is a MainCharacter
 */
export function isMainCharacter(value: Staff | MainCharacter): value is MainCharacter {
  return value.id === 'main-character' && value.roleId === 'main-character';
}

/**
 * Main Character state management functions for service assignment
 */

/**
 * Assign main character to a service (room and customer)
 */
export function assignMainCharacterToService(
  mainCharacter: MainCharacter,
  roomId: number,
  customerId: string,
  staffPosition: GridPosition,
): MainCharacter {
  return {
    ...mainCharacter,
    assignedRoomId: roomId,
    assignedCustomerId: customerId,
    status: 'walking_to_room',
    targetX: staffPosition.x,
    targetY: staffPosition.y,
    facingDirection: staffPosition.facingDirection || mainCharacter.facingDirection || 'down',
  };
}

/**
 * Free main character from service (return to idle)
 */
export function freeMainCharacterFromService(mainCharacter: MainCharacter): MainCharacter {
  return {
    ...mainCharacter,
    assignedRoomId: undefined,
    assignedCustomerId: undefined,
    status: 'walking_to_idle',
    // Note: targetX, targetY, and path should be set separately when calculating return path
  };
}

/**
 * Update main character status
 */
export function updateMainCharacterStatus(
  mainCharacter: MainCharacter,
  status: MainCharacter['status'],
): MainCharacter {
  return {
    ...mainCharacter,
    status,
  };
}

