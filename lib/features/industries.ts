/**
 * Industries Feature
 * Handles all industry-related types, configs, and registry
 */

export interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
  image?: string; // Optional image path for industry cards
  mapImage?: string; // Optional map image path for industry map
  isAvailable?: boolean;
}

// NOTE: legacy static definitions are retained below for future reference/seeding.
// They are intentionally commented out so runtime data must come from Supabase.
/*
export const DentalIndustry: Industry = {
  id: 'dental',
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
*/

let cachedIndustries: Industry[] = [];

export function cacheIndustries(industries: Industry[]): void {
  cachedIndustries = industries.slice();
}

export function getCachedIndustries(): Industry[] {
  return cachedIndustries.slice();
}

export function getCachedIndustryById(id: string): Industry | undefined {
  return cachedIndustries.find((industry) => industry.id === id);
}
