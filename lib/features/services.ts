/**
 * Services Feature
 * Handles all service-related types and mechanics
 */

import { getServicesForIndustry as getServiceDefinitionsForIndustry } from '@/lib/game/config';
import { IndustryId, IndustryServiceDefinition } from '@/lib/game/types';

// Types
export type Service = IndustryServiceDefinition;

/**
 * Returns the available services for a given industry
 */
export function getServicesForIndustry(industryId: IndustryId): Service[] {
  return getServiceDefinitionsForIndustry(industryId);
}
/**
 * Gets a random service from the available services
 * Currently configured for dental industry - easy to extend for other industries
 */
export function getRandomService(industryId: IndustryId): Service {
  const services = getServicesForIndustry(industryId);
  if (services.length === 0) {
    throw new Error(`No services configured for industry "${industryId}".`);
  }
  const randomIndex = Math.floor(Math.random() * services.length);
  return services[randomIndex];
}

/**
 * Gets all available services
 * Currently returns dental services - easy to extend for other industries
 */
export function getAllServices(industryId: IndustryId): Service[] {
  return getServicesForIndustry(industryId);
}

/**
 * Finds a service by ID
 * Currently searches dental services - easy to extend for other industries
 */
export function getServiceById(id: string, industryId: IndustryId): Service | undefined {
  const services = getServicesForIndustry(industryId);
  return services.find((service: Service) => service.id === id);
}
