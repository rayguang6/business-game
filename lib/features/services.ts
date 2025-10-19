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
import {
  getServicesForIndustry as getIndustryServices,
  DEFAULT_INDUSTRY_ID,
} from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';

/**
 * Returns the available services for a given industry
 */
export function getServicesForIndustry(industryId: IndustryId): Service[] {
  const services = getIndustryServices(industryId);
  if (!services || services.length === 0) {
    return getIndustryServices(DEFAULT_INDUSTRY_ID).map((service) => ({ ...service }));
  }
  return services.map((service) => ({ ...service }));
}
/**
 * Gets a random service from the available services
 * Currently configured for dental industry - easy to extend for other industries
 */
export function getRandomService(industryId: IndustryId): Service {
  const services = getServicesForIndustry(industryId);
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
