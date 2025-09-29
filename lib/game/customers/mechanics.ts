import { Customer, CustomerStatus } from './types';
import { CUSTOMER_SPAWN_AREA, DEFAULT_PATIENCE_SECONDS, CUSTOMER_IMAGES, DEFAULT_CUSTOMER_IMAGE } from './config';
import { getRandomService } from '../services/mechanics';
import { secondsToTicks } from '../core/constants';

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
    maxPatience: patience
  };
}

/**
 * Updates a customer's service countdown
 */
export function tickCustomer(customer: Customer): Customer | null {
  if (customer.status === CustomerStatus.InService) {
    const newServiceTimeLeft = customer.serviceTimeLeft - 1;
    if (newServiceTimeLeft <= 0) {
      return null; // Customer completed service, should be removed
    }
    return { ...customer, serviceTimeLeft: newServiceTimeLeft };
  }
  if (customer.status === CustomerStatus.Waiting) {
    const newPatience = customer.patienceLeft - 1;
    if (newPatience <= 0) {
      // Move to LeavingAngry state to show UI feedback
      return { ...customer, status: CustomerStatus.LeavingAngry };
    }
    return { ...customer, patienceLeft: newPatience };
  }
  if (customer.status === CustomerStatus.LeavingAngry) {
    // Keep as-is; removal timing handled by game tick
    return customer;
  }
  return customer;
}

/**
 * Starts service for a waiting customer
 */
export function startService(customer: Customer): Customer {
  if (customer.status === CustomerStatus.Waiting) {
    return { ...customer, status: CustomerStatus.InService };
  }
  return customer;
}

/**
 * Gets customers in service
 */
export function getCustomersInService(customers: Customer[]): Customer[] {
  return customers.filter(c => c.status === CustomerStatus.InService);
}

/**
 * Gets waiting customers
 */
export function getWaitingCustomers(customers: Customer[]): Customer[] {
  return customers.filter(c => c.status === CustomerStatus.Waiting);
}

/**
 * Gets customers in specific room
 */
export function getCustomersInRoom(customers: Customer[], roomId: number): Customer[] {
  return customers.filter(c => c.roomId === roomId && c.status === CustomerStatus.InService);
}

/**
 * Gets available rooms (rooms with no customers)
 */
export function getAvailableRooms(customers: Customer[], maxRooms: number = 2): number[] {
  const occupiedRooms = customers
    .filter(c => c.status === CustomerStatus.InService)
    .map(c => c.roomId)
    .filter(Boolean) as number[];
  
  const availableRooms: number[] = [];
  for (let i = 1; i <= maxRooms; i++) {
    if (!occupiedRooms.includes(i)) {
      availableRooms.push(i);
    }
  }
  return availableRooms;
}

/**
 * Calculates available service slots
 */
export function getAvailableSlots(customers: Customer[]): number {
  const inService = getCustomersInService(customers).length;
  return Math.max(0, 2 - inService); // MAX_CUSTOMER_CAPACITY is 2
}
