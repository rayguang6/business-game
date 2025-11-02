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
 * Gets a random service from the available services using weightage
 * Services with higher weightage are more likely to be selected
 * Currently configured for dental industry - easy to extend for other industries
 */
export function getRandomService(industryId: IndustryId): Service {
  const services = getServicesForIndustry(industryId);
  if (services.length === 0) {
    throw new Error(`No services configured for industry "${industryId}".`);
  }

  // If all services have weightage of 0 or undefined, fall back to uniform random
  const hasWeightage = services.some(service => (service.weightage || 0) > 0);

  if (!hasWeightage) {
    // Uniform random selection
    const randomIndex = Math.floor(Math.random() * services.length);
    return services[randomIndex];
  }

  // Weighted random selection
  return getWeightedRandomService(services);
}

/**
 * Selects a service using weighted random selection
 * @param services - Array of services to choose from
 * @returns Randomly selected service based on weightage
 */
export function getWeightedRandomService(services: Service[]): Service {
  // Calculate total weight
  const totalWeight = services.reduce((sum, service) => sum + (service.weightage || 1), 0);

  // Generate random number between 0 and total weight
  let random = Math.random() * totalWeight;

  // Find the service that corresponds to this random number
  for (const service of services) {
    const weight = service.weightage || 1;
    random -= weight;

    if (random <= 0) {
      return service;
    }
  }

  // Fallback (should not reach here, but just in case)
  return services[0];
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
