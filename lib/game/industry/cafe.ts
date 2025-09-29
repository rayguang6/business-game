import { Industry } from './types';

export const CafeIndustry: Industry = {
  id: 'cafe',
  name: 'Coffee Shop',
  icon: '☕',
  description: 'Serve coffee and light meals',
  color: 'bg-amber-500',
  services: ['service1', 'service2', 'service3'],
  customerConfig: {
    patience: 15, // Coffee customers want quick service
    spawnRate: 1, // Very frequent spawns
    maxCapacity: 3 // Small cafe
  }
};
