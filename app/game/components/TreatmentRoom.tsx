'use client';

import React from 'react';
import { Customer, CustomerStatus } from '@/lib/game/customers/types';
import { CustomerCard } from './CustomerCard';

interface TreatmentRoomProps {
  roomId: number;
  customers: Customer[];
}

export function TreatmentRoom({ roomId, customers }: TreatmentRoomProps) {
  const roomCustomers = customers.filter(c => c.roomId === roomId && c.status === CustomerStatus.InService);
  const isOccupied = roomCustomers.length > 0;

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Room {roomId}</span>
        <span className="text-xs text-gray-500">
          {isOccupied ? 'Occupied' : 'Available'}
        </span>
      </div>
      
      {roomCustomers.map((customer) => (
        <CustomerCard 
          key={customer.id} 
          customer={customer} 
          showServiceProgress={true}
        />
      ))}
    </div>
  );
}
