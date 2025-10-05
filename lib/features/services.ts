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
  demand?: number; // optional demand weighting
}

// Mechanics
import { SERVICE_CONFIG } from '@/lib/config/gameConfig';

const SERVICE_LOOKUP: Record<string, Service[]> = {
  dental: SERVICE_CONFIG.DENTAL_SERVICES.map(service => ({ ...service })),
  restaurant: SERVICE_CONFIG.RESTAURANT_SERVICES.map(service => ({ ...service })),
  gym: SERVICE_CONFIG.GYM_SERVICES.map(service => ({ ...service })),
};

/**
 * Returns the available services for a given industry
 */
export function getServicesForIndustry(industryId: string = 'dental'): Service[] {
  return SERVICE_LOOKUP[industryId] || SERVICE_LOOKUP['dental'];
}
/**
 * Gets a random service from the available services
 * Currently configured for dental industry - easy to extend for other industries
 */
export function getRandomService(industryId: string = 'dental'): Service {
  const services = getServicesForIndustry(industryId);
  const randomIndex = Math.floor(Math.random() * services.length);
  return services[randomIndex];
}

/**
 * Gets all available services
 * Currently returns dental services - easy to extend for other industries
 */
export function getAllServices(industryId: string = 'dental'): Service[] {
  return getServicesForIndustry(industryId);
}

/**
 * Finds a service by ID
 * Currently searches dental services - easy to extend for other industries
 */
export function getServiceById(id: string, industryId: string = 'dental'): Service | undefined {
  const services = getServicesForIndustry(industryId);
  return services.find((service: Service) => service.id === id);
}
