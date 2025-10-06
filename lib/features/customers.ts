/**
 * Customers Feature
 * Handles all customer-related types, config, and mechanics
 */

import { Service } from './services';
import { CUSTOMER_CONFIG, BUSINESS_STATS, MOVEMENT_CONFIG, secondsToTicks } from '@/lib/game/config';

// Types
export enum CustomerStatus {
  // Arrival
  Spawning = 'spawning',       // at door (1s animation)
  WalkingToChair = 'walking_to_chair', // moving to waiting area
  
  // Waiting
  Waiting = 'waiting',         // sitting, patience ticking
  
  // Service
  WalkingToRoom = 'walking_to_room', // moving to treatment room
  InService = 'in_service',    // being served by staff/equipment
  
  // Exit
  WalkingOutHappy = 'walking_out_happy', // leaving satisfied
  LeavingAngry = 'leaving_angry', // walking out angrily (patience ran out)
}

export interface Customer {
  id: string;
  imageSrc: string; // 32x32 avatar frame (top-left if sprite)
  x: number;
  y: number;
  facingDirection?: 'down' | 'left' | 'up' | 'right';
  targetX?: number; // Target position for walking
  targetY?: number;
  path?: GridPosition[]; // Current path waypoints (excluding current tile)
  service: Service;
  status: CustomerStatus;
  serviceTimeLeft: number; // ticks remaining for service completion
  patienceLeft: number; // ticks remaining before leaving (while waiting)
  maxPatience: number; // maximum patience ticks for this customer
  roomId?: number; // assigned treatment room (1, 2, 3, etc.)
  leavingTicks?: number; // ticks spent in LeavingAngry state
}

// Configuration (now using centralized config)
export const CUSTOMER_EMOJIS = ['😊', '😄', '😃', '🙂', '😌', '😋', '🤔', '😎'];

// Re-export from centralized config
export const CUSTOMER_SPAWN_AREA = CUSTOMER_CONFIG.SPAWN_AREA;
export const MAX_CUSTOMER_CAPACITY = CUSTOMER_CONFIG.MAX_TREATMENT_ROOMS;
export const DEFAULT_PATIENCE_SECONDS = BUSINESS_STATS.customerPatienceSeconds;
export const LEAVING_ANGRY_DURATION_TICKS = BUSINESS_STATS.leavingAngryDurationTicks;
export const CUSTOMER_IMAGES = CUSTOMER_CONFIG.IMAGES;
export const DEFAULT_CUSTOMER_IMAGE = CUSTOMER_CONFIG.DEFAULT_IMAGE;

// Mechanics
import { getRandomService } from './services';
import { ENTRY_POSITION, type GridPosition } from '@/lib/game/positioning';

/**
 * Creates a new customer with random properties
 */
export function spawnCustomer(serviceSpeedMultiplier: number = 1, industryId: string = 'dental'): Customer {
  const service = getRandomService(industryId);
  const imageSrc = CUSTOMER_IMAGES[Math.floor(Math.random() * CUSTOMER_IMAGES.length)] || DEFAULT_CUSTOMER_IMAGE;
  const patience = secondsToTicks(DEFAULT_PATIENCE_SECONDS);
  
  // Apply equipment upgrades to service duration
  const effectiveDuration = service.duration * serviceSpeedMultiplier;
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    imageSrc,
    x: ENTRY_POSITION.x, // Spawn at entry position
    y: ENTRY_POSITION.y,
    facingDirection: 'down',
    service: service,
    status: CustomerStatus.Spawning, // Start at door!
    serviceTimeLeft: secondsToTicks(effectiveDuration),
    patienceLeft: patience,
    maxPatience: patience,
  };
}

/**
 * Movement speed (tiles per tick)
 */
const MOVEMENT_SPEED = Math.max(0.01, MOVEMENT_CONFIG.customerTilesPerTick);

/**
 * Moves customer towards target position following an optional path.
 * Movement is restricted to horizontal/vertical steps.
 */
function moveTowardsTarget(customer: Customer): Customer {
  if (customer.targetX === undefined || customer.targetY === undefined) {
    return customer;
  }

  const [nextWaypoint, ...remainingPath] =
    customer.path && customer.path.length > 0
      ? customer.path
      : [{ x: customer.targetX, y: customer.targetY }];

  const dx = nextWaypoint.x - customer.x;
  const dy = nextWaypoint.y - customer.y;

  // Close enough to waypoint - snap to position and advance path
  if (Math.abs(dx) <= MOVEMENT_SPEED && Math.abs(dy) <= MOVEMENT_SPEED) {
    let facingDirection = customer.facingDirection;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0) {
      facingDirection = dx > 0 ? 'right' : 'left';
    } else if (Math.abs(dy) > 0) {
      facingDirection = dy > 0 ? 'down' : 'up';
    }

    const hasMoreWaypoints = remainingPath.length > 0;
    const reachedFinalWaypoint =
      !hasMoreWaypoints &&
      nextWaypoint.x === customer.targetX &&
      nextWaypoint.y === customer.targetY;

    return {
      ...customer,
      x: nextWaypoint.x,
      y: nextWaypoint.y,
      facingDirection,
      path: hasMoreWaypoints ? remainingPath : undefined,
      targetX: reachedFinalWaypoint ? undefined : customer.targetX,
      targetY: reachedFinalWaypoint ? undefined : customer.targetY,
    };
  }

  // Move horizontally or vertically only (not diagonal)
  let newX = customer.x;
  let newY = customer.y;
  let facingDirection = customer.facingDirection;

  const prioritizeHorizontal = Math.abs(dx) >= Math.abs(dy);

  if (prioritizeHorizontal && Math.abs(dx) > 0) {
    const step = Math.sign(dx) * Math.min(MOVEMENT_SPEED, Math.abs(dx));
    newX = customer.x + step;
    facingDirection = step > 0 ? 'right' : 'left';
  } else if (Math.abs(dy) > 0) {
    const step = Math.sign(dy) * Math.min(MOVEMENT_SPEED, Math.abs(dy));
    newY = customer.y + step;
    facingDirection = step > 0 ? 'down' : 'up';
  }

  return {
    ...customer,
    x: newX,
    y: newY,
    facingDirection,
    path: customer.path,
  };
}

/**
 * Check if customer has reached target
 */
function hasReachedTarget(customer: Customer): boolean {
  return customer.targetX === undefined && customer.targetY === undefined;
}

/**
 * Updates a customer's state for one tick
 */
export function tickCustomer(customer: Customer): Customer {
  switch (customer.status) {
    case CustomerStatus.Spawning:
      // After 1 second (10 ticks), move to walking to chair
      return {
        ...customer,
        status: CustomerStatus.WalkingToChair,
      };
    
    case CustomerStatus.WalkingToChair:
      // Move towards target waiting position
      const movedToChair = moveTowardsTarget(customer);
      
      // If reached target, start waiting
      if (hasReachedTarget(movedToChair)) {
        return {
          ...movedToChair,
          status: CustomerStatus.Waiting,
          facingDirection: 'right',
        };
      }

      return movedToChair;

    case CustomerStatus.Waiting:
      const nextStatus = customer.patienceLeft <= 1 ? CustomerStatus.LeavingAngry : CustomerStatus.Waiting;

      return {
        ...customer,
        patienceLeft: Math.max(0, customer.patienceLeft - 1),
        status: nextStatus,
        facingDirection: nextStatus === CustomerStatus.Waiting ? 'right' : customer.facingDirection,
      };
    
    case CustomerStatus.WalkingToRoom:
      // Move towards target service room position
      const movedToRoom = moveTowardsTarget(customer);
      
      // If reached target, start service
      if (hasReachedTarget(movedToRoom)) {
        return {
          ...movedToRoom,
          status: CustomerStatus.InService,
          facingDirection: 'down',
        };
      }

      return movedToRoom;

    case CustomerStatus.InService:
      return {
        ...customer,
        serviceTimeLeft: Math.max(0, customer.serviceTimeLeft - 1),
        status: customer.serviceTimeLeft <= 1 ? CustomerStatus.WalkingOutHappy : CustomerStatus.InService,
        facingDirection: 'down',
      };
    
    case CustomerStatus.WalkingOutHappy:
    case CustomerStatus.LeavingAngry:
      // These states are handled in the main game loop
      return customer;
    
    default:
      return customer;
  }
}

/**
 * Starts service for a customer (assigns to a room)
 */
export function startService(customer: Customer, roomId: number): Customer {
  return {
    ...customer,
    status: CustomerStatus.WalkingToRoom, // First walk to room, then service starts
    roomId,
  };
}

/**
 * Gets available service slots (rooms)
 */
export function getAvailableSlots(customers: Customer[], maxRooms?: number): number[] {
  const occupiedRooms = customers
    .filter(c => (c.status === CustomerStatus.InService || c.status === CustomerStatus.WalkingToRoom) && c.roomId)
    .map(c => c.roomId!);
  
  const roomCount = maxRooms || MAX_CUSTOMER_CAPACITY;
  return Array.from({ length: roomCount }, (_, i) => i + 1)
    .filter(roomId => !occupiedRooms.includes(roomId));
}

/**
 * Gets available rooms (alias for getAvailableSlots)
 */
export function getAvailableRooms(customers: Customer[], maxRooms?: number): number[] {
  return getAvailableSlots(customers, maxRooms);
}
