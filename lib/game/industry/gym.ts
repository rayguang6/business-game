import { Industry } from './types';

export const GymIndustry: Industry = {
  id: 'gym',
  name: 'Fitness Gym',
  icon: '💪',
  description: 'Help people get fit and healthy',
  color: 'bg-green-500',
  services: ['service1', 'service2', 'service3'],
  customerConfig: {
    patience: 20, // Gym members are impatient
    spawnRate: 2, // Very frequent spawns
    maxCapacity: 4 // More equipment
  }
};
