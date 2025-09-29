import { Industry } from './types';

export const RestaurantIndustry: Industry = {
  id: 'restaurant',
  name: 'Restaurant',
  icon: '🍽️',
  description: 'Serve delicious food to hungry customers',
  color: 'bg-orange-500',
  services: ['service1', 'service2', 'service3'], // For now, same services
  customerConfig: {
    patience: 45, // Restaurant customers wait longer
    spawnRate: 3, // More frequent spawns
    maxCapacity: 3 // More tables
  }
};
