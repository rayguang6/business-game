/**
 * Industries Feature
 * Handles all industry-related types, configs, and registry
 */

import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';

// Types
export interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
  image?: string; // Optional image path for industry cards
  mapImage?: string; // Optional map image path for industry map
}

// Industry Definitions
//TODO: Extract to Config, and later Database
export const DentalIndustry: Industry = {
  id: DEFAULT_INDUSTRY_ID,
  name: 'Dental Clinic',
  icon: '🦷',
  description: 'Keep your patients smiling with clean teeth!',
  image: '/images/industries/dental.jpg',
  mapImage: '/images/maps/dental-map.png',
};

export const RestaurantIndustry: Industry = {
  id: 'restaurant',
  name: 'Restaurant',
  icon: '🍽️',
  description: 'Serve delicious meals and build a culinary empire!',
  image: '/images/industries/restaurant.jpg',
  mapImage: '/images/maps/restaurant-map.png',
};

export const GymIndustry: Industry = {
  id: 'gym',
  name: 'Fitness Gym',
  icon: '💪',
  description: 'Help people get fit and build a healthy community!',
  image: '/images/industries/gym.jpg',
  mapImage: '/images/maps/gym-map.png',
};

// Industry Registry
export const INDUSTRIES: Record<string, Industry> = {
  dental: DentalIndustry,
  restaurant: RestaurantIndustry,
  gym: GymIndustry,
} as const;


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
  return INDUSTRIES[id];
}
