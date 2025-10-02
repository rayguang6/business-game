/**
 * Customers Feature
 * Handles all customer-related types, config, and mechanics
 */

import { Service } from './services';
import { secondsToTicks } from '@/lib/core/constants';

// Types
export enum CustomerStatus {
  // Arrival / Queue
  Arriving = 'arriving',       // walking into the shop
  Waiting = 'waiting',         // in queue for service
  
  // Service
  InService = 'in_service',    // being served by staff/equipment
  Paused = 'paused',           // service interrupted (e.g. event)
  
  // Exit
  Paying = 'paying',           // finished service, heading to checkout
  Completed = 'completed',     // paid & happy, increases score
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

// Configuration
export const CUSTOMER_EMOJIS = ['😊', '😄', '😃', '🙂', '😌', '😋', '🤔', '😎'];

export const CUSTOMER_SPAWN_AREA = {
  x: { min: 50, max: 350 },
  y: { min: 50, max: 250 }
};

export const MAX_CUSTOMER_CAPACITY = 2; // maximum customers that can be served simultaneously
export const DEFAULT_PATIENCE_SECONDS = 12;
export const LEAVING_ANGRY_DURATION_TICKS = 10; // How long angry customers stay visible

export const CUSTOMER_IMAGES: string[] = [
  '/images/customer/customer1.png',
  '/images/customer/customer2.png',
  '/images/customer/customer3.png',
  '/images/customer/customer4.png',
  '/images/customer/customer5.png',
  '/images/customer/customer6.png',
  '/images/customer/customer7.png',
  '/images/customer/customer8.png',
  '/images/customer/customer9.png',
  '/images/customer/customer10.png',
];

export const DEFAULT_CUSTOMER_IMAGE = '/images/customer/customer1.png';

// Mechanics
import { getRandomService } from './services';

/**
 * Creates a new customer with random properties
 */
export function spawnCustomer(): Customer {
  const service = getRandomService();
  const imageSrc = CUSTOMER_IMAGES[Math.floor(Math.random() * CUSTOMER_IMAGES.length)] || DEFAULT_CUSTOMER_IMAGE;
  const patience = secondsToTicks(DEFAULT_PATIENCE_SECONDS);
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    imageSrc,
    x: Math.random() * (CUSTOMER_SPAWN_AREA.x.max - CUSTOMER_SPAWN_AREA.x.min) + CUSTOMER_SPAWN_AREA.x.min,
    y: Math.random() * (CUSTOMER_SPAWN_AREA.y.max - CUSTOMER_SPAWN_AREA.y.min) + CUSTOMER_SPAWN_AREA.y.min,
    service: service,
    status: CustomerStatus.Waiting,
    serviceTimeLeft: secondsToTicks(service.duration),
    patienceLeft: patience,
    maxPatience: patience,
  };
}

/**
 * Updates a customer's state for one tick
 */
export function tickCustomer(customer: Customer): Customer {
  switch (customer.status) {
    case CustomerStatus.Waiting:
      return {
        ...customer,
        patienceLeft: Math.max(0, customer.patienceLeft - 1),
        status: customer.patienceLeft <= 1 ? CustomerStatus.LeavingAngry : CustomerStatus.Waiting,
      };
    
    case CustomerStatus.InService:
      return {
        ...customer,
        serviceTimeLeft: Math.max(0, customer.serviceTimeLeft - 1),
        status: customer.serviceTimeLeft <= 1 ? CustomerStatus.Paying : CustomerStatus.InService,
      };
    
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
    status: CustomerStatus.InService,
    roomId,
  };
}

/**
 * Gets available service slots (rooms)
 */
export function getAvailableSlots(customers: Customer[]): number[] {
  const occupiedRooms = customers
    .filter(c => c.status === CustomerStatus.InService && c.roomId)
    .map(c => c.roomId!);
  
  const maxRooms = MAX_CUSTOMER_CAPACITY;
  return Array.from({ length: maxRooms }, (_, i) => i + 1)
    .filter(roomId => !occupiedRooms.includes(roomId));
}

/**
 * Gets available rooms (alias for getAvailableSlots)
 */
export function getAvailableRooms(customers: Customer[]): number[] {
  return getAvailableSlots(customers);
}
