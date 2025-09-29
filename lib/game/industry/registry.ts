import { Industry } from './types';
import { DentalIndustry } from './dental';

export const INDUSTRIES = {
  dental: DentalIndustry,
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
 * Now we make dental only
 */
export function getRandomIndustry(): Industry {
  return INDUSTRIES.dental;
}
