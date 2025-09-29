import { Industry } from './types';

export const DentalIndustry: Industry = {
  id: 'dental',
  name: 'Dental Clinic',
  icon: '🦷',
  description: 'Keep your patients smiling with clean teeth!',
  color: 'bg-blue-500',
  services: ['service1', 'service2', 'service3'], // references to service IDs
};
