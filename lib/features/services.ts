/**
 * Services Feature
 * Handles all service-related types and mechanics
 */

import { getServicesForIndustry as getServiceDefinitionsForIndustry } from '@/lib/game/config';
import { IndustryId, IndustryServiceDefinition } from '@/lib/game/types';
import { effectManager, GameMetric } from '@/lib/game/effectManager';

/**
 * Represents a service with its effective values (after applying tier multipliers)
 */
export interface EffectiveService extends Service {
  effectivePrice: number;
  effectiveWeightage: number;
  selectionProbability: number;
}

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
 * Selects a service using weighted random selection with tier-specific multipliers
 * @param services - Array of services to choose from
 * @returns Randomly selected service based on weightage and tier multipliers
 */
export function getWeightedRandomService(services: Service[]): Service {
  // Get tier multipliers from effect manager
  const tierMultipliers = {
    high: effectManager.calculate(GameMetric.HighTierServiceWeightageMultiplier, 1),
    mid: effectManager.calculate(GameMetric.MidTierServiceWeightageMultiplier, 1),
    low: effectManager.calculate(GameMetric.LowTierServiceWeightageMultiplier, 1),
  };

  // Calculate effective weights with tier multipliers
  const servicesWithEffectiveWeights = services.map(service => ({
    service,
    effectiveWeight: (service.weightage || 1) * tierMultipliers[service.pricingCategory || 'mid']
  }));

  // Calculate total weight using effective weights
  const totalWeight = servicesWithEffectiveWeights.reduce(
    (sum, { effectiveWeight }) => sum + effectiveWeight, 0
  );

  // Generate random number between 0 and total weight
  let random = Math.random() * totalWeight;

  // Find the service that corresponds to this random number
  for (const { service, effectiveWeight } of servicesWithEffectiveWeights) {
    random -= effectiveWeight;
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

/**
 * Returns services with their effective values (price and weightage with multipliers applied)
 * Includes selection probabilities for UI display
 */
export function getEffectiveServices(industryId: IndustryId): EffectiveService[] {
  const services = getServicesForIndustry(industryId);

  // Get tier multipliers from effect manager
  const tierRevenueMultipliers = {
    high: effectManager.calculate(GameMetric.HighTierServiceRevenueMultiplier, 1),
    mid: effectManager.calculate(GameMetric.MidTierServiceRevenueMultiplier, 1),
    low: effectManager.calculate(GameMetric.LowTierServiceRevenueMultiplier, 1),
  };

  const tierWeightageMultipliers = {
    high: effectManager.calculate(GameMetric.HighTierServiceWeightageMultiplier, 1),
    mid: effectManager.calculate(GameMetric.MidTierServiceWeightageMultiplier, 1),
    low: effectManager.calculate(GameMetric.LowTierServiceWeightageMultiplier, 1),
  };

  // Calculate effective weights and prices
  const servicesWithEffectiveValues = services.map(service => ({
    service,
    effectivePrice: service.price * tierRevenueMultipliers[service.pricingCategory || 'mid'],
    effectiveWeightage: (service.weightage || 1) * tierWeightageMultipliers[service.pricingCategory || 'mid']
  }));

  // Calculate total weight for probability calculation
  const totalWeight = servicesWithEffectiveValues.reduce(
    (sum, { effectiveWeightage }) => sum + effectiveWeightage, 0
  );

  // Return services with all effective values and probabilities
  return servicesWithEffectiveValues.map(({ service, effectivePrice, effectiveWeightage }) => ({
    ...service,
    effectivePrice: Math.round(effectivePrice * 100) / 100, // Round to 2 decimal places
    effectiveWeightage: Math.round(effectiveWeightage * 100) / 100,
    selectionProbability: totalWeight > 0 ? Math.round((effectiveWeightage / totalWeight) * 100) : 0
  }));
}
