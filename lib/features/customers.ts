/**
 * Customers Feature
 * Handles all customer-related types, config, and mechanics
 */

import { Service } from './services';
import { CUSTOMER_CONFIG, BUSINESS_STATS, secondsToTicks } from '@/lib/game/config';

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
import { ENTRY_POSITION } from '@/lib/game/positioning';

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
    service: service,
    status: CustomerStatus.Spawning, // Start at door!
    serviceTimeLeft: secondsToTicks(effectiveDuration),
    patienceLeft: patience,
    maxPatience: patience,
  };
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
      // After moving animation, start waiting
      return {
        ...customer,
        status: CustomerStatus.Waiting,
      };
    
    case CustomerStatus.Waiting:
      return {
        ...customer,
        patienceLeft: Math.max(0, customer.patienceLeft - 1),
        status: customer.patienceLeft <= 1 ? CustomerStatus.LeavingAngry : CustomerStatus.Waiting,
      };
    
    case CustomerStatus.WalkingToRoom:
      // After moving animation, start service
      return {
        ...customer,
        status: CustomerStatus.InService,
      };
    
    case CustomerStatus.InService:
      return {
        ...customer,
        serviceTimeLeft: Math.max(0, customer.serviceTimeLeft - 1),
        status: customer.serviceTimeLeft <= 1 ? CustomerStatus.WalkingOutHappy : CustomerStatus.InService,
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
