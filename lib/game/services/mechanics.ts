import { Service } from './types';
import { DENTAL_SERVICES } from './config';

/**
 * Gets a random service from the available services
 */
export function getRandomService(): Service {
  const randomIndex = Math.floor(Math.random() * DENTAL_SERVICES.length);
  return DENTAL_SERVICES[randomIndex];
}

/**
 * Gets all available services
 */
export function getAllServices(): Service[] {
  return DENTAL_SERVICES;
}

/**
 * Finds a service by ID
 */
export function getServiceById(id: string): Service | undefined {
  return DENTAL_SERVICES.find(service => service.id === id);
}
