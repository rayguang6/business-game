import { Industry } from './types';

export const DentalIndustry: Industry = {
  id: 'dental',
  name: 'Dental Clinic',
  icon: '🦷',
  description: 'Keep your patients smiling with clean teeth!',
  image: '/images/industries/dental.jpg', // Optional image path
  color: 'bg-blue-500',
  services: ['service1', 'service2', 'service3'], // references to service IDs
};
