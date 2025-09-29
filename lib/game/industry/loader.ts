import { Industry } from './types';
import { getIndustryById } from './registry';

/**
 * Loads industry-specific configuration and applies it to game systems
 * This is where industry acts as a "container" that configures other systems
 */
export function loadIndustryConfig(industryId: string) {
  const industry = getIndustryById(industryId);
  if (!industry) {
    throw new Error(`Industry ${industryId} not found`);
  }

  return {
    industry,
    // Industry-specific customer spawn rate
    customerSpawnRate: industry.customerConfig?.spawnRate || 4,
    // Industry-specific customer patience
    customerPatience: industry.customerConfig?.patience || 30,
    // Industry-specific capacity
    maxCapacity: industry.customerConfig?.maxCapacity || 2,
    // Industry-specific services (could filter services by industry.services array)
    availableServices: industry.services, // For now, all services are available
  };
}
