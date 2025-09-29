import { Service } from '../services/types';

export enum CustomerStatus {
  // Arrival / Queue
  Arriving = 'arriving',       // walking into the shop
  Waiting = 'waiting',         // in queue for service
  LeftAngry = 'left_angry',   // patience ran out, leaves
  
  // Service
  InService = 'in_service',    // being served by staff/equipment
  Paused = 'paused',           // service interrupted (e.g. event)
  
  // Exit
  Paying = 'paying',           // finished service, heading to checkout
  Completed = 'completed',     // paid & happy, increases score
  Leaving = 'leaving',         // walking out (animation, transitional)
}

export interface Customer {
  id: string;
  emoji: string;
  x: number;
  y: number;
  service: Service;
  status: CustomerStatus;
  serviceTimeLeft: number; // ticks remaining for service completion
}
