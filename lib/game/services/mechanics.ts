import { Service } from '@/lib/game/services/types';
import { DENTAL_SERVICES } from '@/lib/game/industry/configs/dentalServices';

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
  return DENTAL_SERVICES.find(service => service.id === id);
}
