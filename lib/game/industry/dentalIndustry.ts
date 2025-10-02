import { Industry } from '@/lib/game/industry/types';
import { DENTAL_SERVICE_IDS } from '@/lib/game/industry/configs/dentalServices';

export const DentalIndustry: Industry = {
  id: 'dental',
  name: 'Dental Clinic',
  icon: '🦷',
  description: 'Keep your patients smiling with clean teeth!',
  image: '/images/industries/dental.jpg', // Optional image path
  color: 'bg-blue-500',
  services: DENTAL_SERVICE_IDS, // references to dental-specific service IDs
};
