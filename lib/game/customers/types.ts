import { Service } from '../services/types';

export enum CustomerStatus {
  // Arrival / Queue
  Arriving = 'arriving',       // walking into the shop
  Waiting = 'waiting',         // in queue for service
  
  // Service
  InService = 'in_service',    // being served by staff/equipment
  Paused = 'paused',           // service interrupted (e.g. event)
  
  // Exit
  Paying = 'paying',           // finished service, heading to checkout
  Completed = 'completed',     // paid & happy, increases score
  LeavingAngry = 'leaving_angry', // walking out angrily (patience ran out)
}

export interface Customer {
  id: string;
  imageSrc: string; // 32x32 avatar frame (top-left if sprite)
  x: number;
  y: number;
  service: Service;
  status: CustomerStatus;
  serviceTimeLeft: number; // ticks remaining for service completion
  patienceLeft: number; // ticks remaining before leaving (while waiting)
  maxPatience: number; // maximum patience ticks for this customer
  roomId?: number; // assigned treatment room (1, 2, 3, etc.)
}
