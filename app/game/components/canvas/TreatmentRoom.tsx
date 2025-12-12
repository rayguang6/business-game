'use client';

import React from 'react';
import { Customer, CustomerStatus } from '@/lib/features/customers';
import { CustomerCard } from './CustomerCard';

interface TreatmentRoomProps {
  roomId: number;
  customers: Customer[];
  scaleFactor: number;
}

export function TreatmentRoom({ roomId, customers, scaleFactor }: TreatmentRoomProps) {
  const roomCustomers = customers.filter(c => c.roomId === roomId && c.status === CustomerStatus.InService);
  const isOccupied = roomCustomers.length > 0;

  return (
    <div 
      className="bg-gray-50 rounded-lg border border-gray-200"
      style={{
        padding: `${8 * scaleFactor}px`,
        borderRadius: `${8 * scaleFactor}px`
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className="font-medium text-gray-700"
          style={{ fontSize: `${14 * scaleFactor}px` }}
        >
          Room {roomId}
        </span>
        <span
          className="text-gray-500"
          style={{ fontSize: `${14 * scaleFactor}px` }}
        >
          {isOccupied ? 'Occupied' : 'Available'}
        </span>
      </div>
      
      {roomCustomers.map((customer) => (
        <CustomerCard 
          key={customer.id} 
          customer={customer} 
          showServiceProgress={true}
          scaleFactor={scaleFactor}
        />
      ))}
    </div>
  );
}
