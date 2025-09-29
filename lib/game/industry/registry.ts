import { Industry } from './types';
import { DentalIndustry } from './dental';
import { RestaurantIndustry } from './restaurant';
import { SalonIndustry } from './salon';
import { GymIndustry } from './gym';
import { CafeIndustry } from './cafe';

export const INDUSTRIES = {
  dental: DentalIndustry,
  restaurant: RestaurantIndustry,
  salon: SalonIndustry,
  gym: GymIndustry,
  cafe: CafeIndustry,
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

/**
 * Gets a random industry
 */
export function getRandomIndustry(): Industry {
  const industryIds = Object.keys(INDUSTRIES) as IndustryId[];
  const randomIndex = Math.floor(Math.random() * industryIds.length);
  return INDUSTRIES[industryIds[randomIndex]];
}
