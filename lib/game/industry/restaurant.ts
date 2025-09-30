import { Industry } from './types';

export const RestaurantIndustry: Industry = {
  id: 'restaurant',
  name: 'Restaurant',
  icon: '🍽️',
  description: 'Serve delicious meals and build a culinary empire!',
  image: '/images/industries/restaurant.jpg', // Optional image path
  color: 'bg-orange-500',
  services: ['service1', 'service2', 'service3'], // references to service IDs
};
