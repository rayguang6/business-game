import { Industry } from './types';

export const SalonIndustry: Industry = {
  id: 'salon',
  name: 'Hair Salon',
  icon: '💇‍♀️',
  description: 'Style hair and provide beauty services',
  color: 'bg-pink-500',
  services: ['service1', 'service2', 'service3'],
  customerConfig: {
    patience: 60, // Salon customers are patient
    spawnRate: 5, // Slower spawns
    maxCapacity: 2
  }
};
