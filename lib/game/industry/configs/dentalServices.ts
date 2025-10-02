import { Service } from '../../services/types';

/**
 * Dental industry specific configuration
 * This makes it easy to change dental services later or add new industries
 */

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

/**
 * Dental industry service IDs for easy reference
 */
export const DENTAL_SERVICE_IDS = DENTAL_SERVICES.map(service => service.id);

