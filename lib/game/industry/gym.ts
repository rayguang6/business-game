import { Industry } from './types';

export const GymIndustry: Industry = {
  id: 'gym',
  name: 'Fitness Gym',
  icon: '💪',
  description: 'Help people get fit and build a healthy community!',
  image: '/images/industries/gym.jpg', // Optional image path
  color: 'bg-red-500',
  services: ['service1', 'service2', 'service3'], // references to service IDs
};
