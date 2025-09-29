import { Customer, CustomerStatus } from './types';
import { CUSTOMER_EMOJIS, CUSTOMER_SPAWN_AREA } from './config';
import { getRandomService } from '../services/mechanics';
import { secondsToTicks } from '../core/constants';

/**
 * Creates a new customer with random properties
 */
export function spawnCustomer(): Customer {
  const randomEmoji = CUSTOMER_EMOJIS[Math.floor(Math.random() * CUSTOMER_EMOJIS.length)];
  const service = getRandomService();
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    emoji: randomEmoji,
    x: Math.random() * (CUSTOMER_SPAWN_AREA.x.max - CUSTOMER_SPAWN_AREA.x.min) + CUSTOMER_SPAWN_AREA.x.min,
    y: Math.random() * (CUSTOMER_SPAWN_AREA.y.max - CUSTOMER_SPAWN_AREA.y.min) + CUSTOMER_SPAWN_AREA.y.min,
    service: service,
    status: CustomerStatus.Waiting,
    serviceTimeLeft: secondsToTicks(service.duration)
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
 * Calculates available service slots
 */
export function getAvailableSlots(customers: Customer[]): number {
  const inService = getCustomersInService(customers).length;
  return Math.max(0, 2 - inService); // MAX_CUSTOMER_CAPACITY is 2
}
