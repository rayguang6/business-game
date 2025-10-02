/**
 * Services Feature
 * Handles all service-related types and mechanics
 */

// Types
export interface Service {
  id: string;
  name: string;
  duration: number; // in seconds
  price: number; // in dollars
}

// Mechanics
import { DENTAL_SERVICES } from './industries';

/**
 * Gets a random service from the available services
 * Currently configured for dental industry - easy to extend for other industries
 */
export function getRandomService(): Service {
  const randomIndex = Math.floor(Math.random() * DENTAL_SERVICES.length);
  return DENTAL_SERVICES[randomIndex];
}

/**
 * Gets all available services
 * Currently returns dental services - easy to extend for other industries
 */
export function getAllServices(): Service[] {
  return DENTAL_SERVICES;
}

/**
 * Finds a service by ID
 * Currently searches dental services - easy to extend for other industries
 */
export function getServiceById(id: string): Service | undefined {
  return DENTAL_SERVICES.find((service: Service) => service.id === id);
}
