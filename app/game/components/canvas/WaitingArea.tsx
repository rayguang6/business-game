'use client';

import React from 'react';
import { Customer, CustomerStatus } from '@/lib/features/customers';
import { CustomerCard } from './CustomerCard';

interface WaitingAreaProps {
  customers: Customer[];
  scaleFactor: number;
}

export function WaitingArea({ customers, scaleFactor }: WaitingAreaProps) {
  const waitingCustomers = customers.filter(c => c.status === CustomerStatus.Waiting);
  const leavingCustomers = customers.filter(c => c.status === CustomerStatus.LeavingAngry);

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <h4
          className="font-semibold text-gray-700"
          style={{ fontSize: `${14 * scaleFactor}px` }}
        >
          Waiting Area
        </h4>
        <div
          className="text-gray-500"
          style={{ fontSize: `${14 * scaleFactor}px` }}
        >
          {waitingCustomers.length} waiting
        </div>
      </div>
      
      <div className="space-y-1">
        {/* Show angry customers who are leaving */}
        {leavingCustomers.map((customer) => (
          <div key={customer.id} className="opacity-80">
            <CustomerCard 
              customer={customer} 
              scaleFactor={scaleFactor}
            />
          </div>
        ))}
        
        {/* Show waiting customers */}
        {waitingCustomers.map((customer) => (
          <CustomerCard 
            key={customer.id} 
            customer={customer} 
            showPatience={true}
            scaleFactor={scaleFactor}
          />
        ))}
      </div>
    </div>
  );
}
