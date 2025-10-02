import { Industry } from './types';
import { DentalIndustry } from './dentalIndustry';
import { RestaurantIndustry } from './restaurant';
import { GymIndustry } from './gym';

export const INDUSTRIES = {
  dental: DentalIndustry,
  restaurant: RestaurantIndustry,
  gym: GymIndustry,
} as const;

export type IndustryId = keyof typeof INDUSTRIES;

/**
 * Gets all available industries
 */
export function getAllIndustries(): Industry[] {
  return Object.values(INDUSTRIES);
}

/**
 * Finds an industry by ID
 */
export function getIndustryById(id: string): Industry | undefined {
  return INDUSTRIES[id as IndustryId];
}

