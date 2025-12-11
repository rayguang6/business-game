/**
 * Customers Feature
 * Handles all customer-related types, config, and mechanics
 */

import { Service } from './services';
import { effectManager, GameMetric } from '@/lib/game/effectManager';
import {
  DEFAULT_INDUSTRY_ID,
  getBusinessStats,
  getCustomerImagesForIndustry,
  getDefaultCustomerImageForIndustry,
  getLayoutConfig,
  getGlobalMovementConfig,
  secondsToTicks,
} from '@/lib/game/config';
import { IndustryId, GridPosition, ServicePricingCategory } from '@/lib/game/types';

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
  finalPrice?: number; // Final price customer will pay (calculated when service starts)
  status: CustomerStatus;
  serviceTimeLeft: number; // ticks remaining for service completion
  patienceLeft: number; // ticks remaining before leaving (while waiting)
  maxPatience: number; // maximum patience ticks for this customer
  roomId?: number; // assigned treatment room (1, 2, 3, etc.)
  leavingTicks?: number; // ticks spent in LeavingAngry state
  waitingPositionFacing?: 'down' | 'left' | 'up' | 'right'; // Facing direction for waiting position (stored when assigned)
  servicePositionFacing?: 'down' | 'left' | 'up' | 'right'; // Facing direction for service position (stored when assigned)
}

// Configuration (now using centralized config)
export const CUSTOMER_EMOJIS = ['😊', '😄', '😃', '🙂', '😌', '😋', '🤔', '😎'];

// Mechanics
import { getRandomService } from './services';

/**
 * Calculates the final price a customer will pay for a service after all multipliers and bonuses
 * This matches the revenue calculation used in game mechanics
 */
export function calculateFinalServicePrice(service: Service, industryId: IndustryId): number {
  // Get tier revenue multiplier
  const getTierRevenueMultiplier = (tier?: ServicePricingCategory): number => {
    switch (tier) {
      case 'high':
        return effectManager.calculate(GameMetric.HighTierServiceRevenueMultiplier, 1);
      case 'mid':
        return effectManager.calculate(GameMetric.MidTierServiceRevenueMultiplier, 1);
      case 'low':
        return effectManager.calculate(GameMetric.LowTierServiceRevenueMultiplier, 1);
      default:
        return 1;
    }
  };

  // Get current game metrics
  const serviceRevenueMultiplier = effectManager.calculate(GameMetric.ServiceRevenueMultiplier, 100);
  const serviceRevenueFlatBonus = effectManager.calculate(GameMetric.ServiceRevenueFlatBonus, 0);

  // Get service revenue scale from business stats (industry config)
  const businessStats = getBusinessStats(industryId);
  const serviceRevenueScale = businessStats?.serviceRevenueScale ?? 10;

  const servicePrice = service.price;
  const tierMultiplier = getTierRevenueMultiplier(service.pricingCategory);
  const baseServiceValue = (servicePrice * tierMultiplier) + serviceRevenueFlatBonus;
  const finalPrice = Math.max(0, baseServiceValue) * (serviceRevenueMultiplier / 100) * serviceRevenueScale;

  return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Creates a new customer with random properties
 */
export function spawnCustomer(
  serviceSpeedMultiplier: number = 1,
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): Customer {
  const service = getRandomService(industryId);
  const industryImages = getCustomerImagesForIndustry(industryId);
  const defaultImage = getDefaultCustomerImageForIndustry(industryId);
  const imageSrc = industryImages[Math.floor(Math.random() * industryImages.length)] || defaultImage;
  const stats = getBusinessStats(industryId);
  const layout = getLayoutConfig(industryId);
  if (!stats || !layout) throw new Error('Business config not loaded');

  // Calculate effective patience with effects applied
  const effectivePatienceSeconds = effectManager.calculate(GameMetric.CustomerPatienceSeconds, stats.customerPatienceSeconds);
  const patience = secondsToTicks(effectivePatienceSeconds, industryId);
  const spawnPosition = stats.customerSpawnPosition ?? (layout ? layout.entryPosition : { x: 4, y: 9 });

  // Convert the aggregated speed multiplier into a shorter duration (higher speed = shorter time)
  const effectiveDuration = service.duration / Math.max(serviceSpeedMultiplier, 0.1);

  return {
    id: Math.random().toString(36).substr(2, 9),
    imageSrc,
    x: spawnPosition.x,
    y: spawnPosition.y,
    facingDirection: 'down',
    service: service,
    // finalPrice will be calculated when service starts
    status: CustomerStatus.Spawning, // Start at door!
    serviceTimeLeft: secondsToTicks(effectiveDuration, industryId),
    patienceLeft: patience,
    maxPatience: patience,
  };
}

/**
 * Movement speed (tiles per tick)
 */
const getMovementSpeed = () => {
  const movement = getGlobalMovementConfig();
  if (!movement) throw new Error('Movement config not loaded');
  return Math.max(0.01, movement.customerTilesPerTick);
};

/**
 * Moves customer towards target position following an optional path.
 * Movement is restricted to horizontal/vertical steps.
 */
function moveTowardsTarget(customer: Customer): Customer {
  const movementSpeed = getMovementSpeed();
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
  if (Math.abs(dx) <= movementSpeed && Math.abs(dy) <= movementSpeed) {
    const hasMoreWaypoints = remainingPath.length > 0;
    const reachedFinalWaypoint =
      !hasMoreWaypoints &&
      nextWaypoint.x === customer.targetX &&
      nextWaypoint.y === customer.targetY;

    // If we've reached the final waypoint, use the configured facing direction (waitingPositionFacing or servicePositionFacing)
    // Otherwise, use movement-based facing direction
    let facingDirection = customer.facingDirection;
    if (reachedFinalWaypoint) {
      // Prefer servicePositionFacing (for service rooms) over waitingPositionFacing (for waiting positions)
      if (customer.servicePositionFacing) {
        facingDirection = customer.servicePositionFacing;
      } else if (customer.waitingPositionFacing) {
        facingDirection = customer.waitingPositionFacing;
      }
    } else {
      // Use movement-based facing direction for intermediate waypoints
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0) {
        facingDirection = dx > 0 ? 'right' : 'left';
      } else if (Math.abs(dy) > 0) {
        facingDirection = dy > 0 ? 'down' : 'up';
      }
    }

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
    const step = Math.sign(dx) * Math.min(movementSpeed, Math.abs(dx));
    newX = customer.x + step;
    facingDirection = step > 0 ? 'right' : 'left';
  } else if (Math.abs(dy) > 0) {
    const step = Math.sign(dy) * Math.min(movementSpeed, Math.abs(dy));
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
        // Use the facing direction stored when position was assigned (defaults to 'right' for backward compatibility)
        const facingDirection = movedToChair.waitingPositionFacing || 'right';
        return {
          ...movedToChair,
          status: CustomerStatus.Waiting,
          facingDirection,
        };
      }

      return movedToChair;

    case CustomerStatus.Waiting:
      // If patience runs out, customer leaves angrily. Else it remains the 'waiting' status
      const nextStatus = customer.patienceLeft <= 1 ? CustomerStatus.LeavingAngry : CustomerStatus.Waiting;
      // Keep the facing direction from waiting position (or default to 'right' for backward compatibility)
      const waitingFacing = customer.waitingPositionFacing || 'right';

      // Ensure facing direction is set correctly (in case it was overwritten)
      const finalFacingDirection = nextStatus === CustomerStatus.Waiting ? waitingFacing : customer.facingDirection;

      return {
        ...customer,
        patienceLeft: Math.max(0, customer.patienceLeft - 1),
        status: nextStatus,
        facingDirection: finalFacingDirection,
        ...(nextStatus === CustomerStatus.LeavingAngry && { leavingTicks: 0 }), // Initialize animation timer
      };
    
    case CustomerStatus.WalkingToRoom:
      // Move towards target service room position
      const movedToRoom = moveTowardsTarget(customer);
      
      // If reached target, start service
      if (hasReachedTarget(movedToRoom)) {
        // Use the facing direction stored when service position was assigned (defaults to 'down' for backward compatibility)
        const facingDirection = movedToRoom.servicePositionFacing || 'down';
        return {
          ...movedToRoom,
          status: CustomerStatus.InService,
          facingDirection,
        };
      }

      return movedToRoom;

    case CustomerStatus.InService:
      // Keep the facing direction from service position (or default to 'down' for backward compatibility)
      const serviceFacing = customer.servicePositionFacing || 'down';
      return {
        ...customer,
        serviceTimeLeft: Math.max(0, customer.serviceTimeLeft - 1),
        status: customer.serviceTimeLeft <= 1 ? CustomerStatus.WalkingOutHappy : CustomerStatus.InService,
        facingDirection: serviceFacing,
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
 * Recalculates serviceTimeLeft based on current serviceSpeedMultiplier
 * This ensures service speed upgrades apply to waiting customers
 * Also calculates the final price when service starts
 */
export function startService(
  customer: Customer,
  roomId: number,
  serviceSpeedMultiplier: number = 1,
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): Customer {
  // Recalculate service time based on current service speed multiplier
  // This ensures that service speed upgrades apply to customers who were waiting
  const effectiveDuration = customer.service.duration / Math.max(serviceSpeedMultiplier, 0.1);
  const newServiceTimeLeft = secondsToTicks(effectiveDuration, industryId);

  // Calculate the final price when service starts (not when customer spawns)
  const finalPrice = calculateFinalServicePrice(customer.service, industryId);

  return {
    ...customer,
    status: CustomerStatus.WalkingToRoom, // First walk to room, then service starts
    roomId,
    serviceTimeLeft: newServiceTimeLeft,
    finalPrice: finalPrice,
  };
}

/**
 * Gets available service slots (rooms)
 */
export function getAvailableSlots(customers: Customer[], maxRooms?: number, industryId: IndustryId = DEFAULT_INDUSTRY_ID): number[] {
  const occupiedRooms = customers
    .filter(c => (c.status === CustomerStatus.InService || c.status === CustomerStatus.WalkingToRoom) && c.roomId)
    .map(c => c.roomId!);
  
  // Get the requested room count (no cap - handled by upgrades)
  const stats = getBusinessStats(industryId);
  if (!stats) throw new Error('Business stats not loaded');
  const requestedRoomCount = maxRooms || stats.serviceCapacity;
  const roomCount = Math.max(1, Math.round(requestedRoomCount));
  
  return Array.from({ length: roomCount }, (_, i) => i + 1)
    .filter(roomId => !occupiedRooms.includes(roomId));
}

/**
 * Gets available rooms (alias for getAvailableSlots)
 */
export function getAvailableRooms(customers: Customer[], maxRooms?: number, industryId: IndustryId = DEFAULT_INDUSTRY_ID): number[] {
  return getAvailableSlots(customers, maxRooms, industryId);
}
