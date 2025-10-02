/**
 * Industries Feature
 * Handles all industry-related types, configs, and registry
 */

import { Service } from './services';

// Types
export interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
  image?: string; // Optional image path for industry cards
  color: string;
  services: string[]; // references to service IDs
}

// Dental Services Configuration
export const DENTAL_SERVICES: Service[] = [
  {
    id: 'dental_whitening',
    name: 'Teeth Whitening',
    duration: 18,
    price: 100
  },
  {
    id: 'dental_cleaning',
    name: 'Dental Cleaning',
    duration: 15,
    price: 150
  },
  {
    id: 'dental_filling',
    name: 'Cavity Filling',
    duration: 10,
    price: 200
  }
];

export const DENTAL_SERVICE_IDS = DENTAL_SERVICES.map(service => service.id);

// Industry Definitions
export const DentalIndustry: Industry = {
  id: 'dental',
  name: 'Dental Clinic',
  icon: '🦷',
  description: 'Keep your patients smiling with clean teeth!',
  image: '/images/industries/dental.jpg',
  color: 'bg-blue-500',
  services: DENTAL_SERVICE_IDS,
};

export const RestaurantIndustry: Industry = {
  id: 'restaurant',
  name: 'Restaurant',
  icon: '🍽️',
  description: 'Serve delicious meals and build a culinary empire!',
  image: '/images/industries/restaurant.jpg',
  color: 'bg-orange-500',
  services: ['service1', 'service2', 'service3'], // Placeholder for future implementation
};

export const GymIndustry: Industry = {
  id: 'gym',
  name: 'Fitness Gym',
  icon: '💪',
  description: 'Help people get fit and build a healthy community!',
  image: '/images/industries/gym.jpg',
  color: 'bg-red-500',
  services: ['service1', 'service2', 'service3'], // Placeholder for future implementation
};

// Industry Registry
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
