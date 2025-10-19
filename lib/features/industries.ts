/**
 * Industries Feature
 * Handles all industry-related types, configs, and registry
 */

import { Service, getServicesForIndustry } from './services';
import { IndustryId } from '@/lib/game/types';

// Types
export interface Industry {
  id: IndustryId;
  name: string;
  icon: string;
  description: string;
  image?: string; // Optional image path for industry cards
  mapImage?: string; // Optional map image path for industry map
  color: string;
  services: string[]; // references to service IDs
}

// Dental Services Configuration (now using centralized config)
export const DENTAL_SERVICES: Service[] = getServicesForIndustry(IndustryId.Dental);
export const DENTAL_SERVICE_IDS = DENTAL_SERVICES.map(service => service.id);

export const RESTAURANT_SERVICES: Service[] = getServicesForIndustry(IndustryId.Restaurant);
export const RESTAURANT_SERVICE_IDS = RESTAURANT_SERVICES.map(service => service.id);

export const GYM_SERVICES: Service[] = getServicesForIndustry(IndustryId.Gym);
export const GYM_SERVICE_IDS = GYM_SERVICES.map(service => service.id);

// Industry Definitions
//TODO: Extract to Config, and later Database
export const DentalIndustry: Industry = {
  id: IndustryId.Dental,
  name: 'Dental Clinic',
  icon: '🦷',
  description: 'Keep your patients smiling with clean teeth!',
  image: '/images/industries/dental.jpg',
  mapImage: '/images/maps/dental-map.png',
  color: 'bg-blue-500',
  services: DENTAL_SERVICE_IDS,
};

export const RestaurantIndustry: Industry = {
  id: IndustryId.Restaurant,
  name: 'Restaurant',
  icon: '🍽️',
  description: 'Serve delicious meals and build a culinary empire!',
  image: '/images/industries/restaurant.jpg',
  mapImage: '/images/maps/restaurant-map.png',
  color: 'bg-orange-500',
  services: RESTAURANT_SERVICE_IDS,
};

export const GymIndustry: Industry = {
  id: IndustryId.Gym,
  name: 'Fitness Gym',
  icon: '💪',
  description: 'Help people get fit and build a healthy community!',
  image: '/images/industries/gym.jpg',
  mapImage: '/images/maps/gym-map.png',
  color: 'bg-red-500',
  services: GYM_SERVICE_IDS,
};

// Industry Registry
export const INDUSTRIES: Record<IndustryId, Industry> = {
  [IndustryId.Dental]: DentalIndustry,
  [IndustryId.Restaurant]: RestaurantIndustry,
  [IndustryId.Gym]: GymIndustry,
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
export function getIndustryById(id: IndustryId): Industry | undefined {
  return INDUSTRIES[id];
}
