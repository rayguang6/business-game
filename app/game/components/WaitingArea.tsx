'use client';

import React from 'react';
import { Customer, CustomerStatus } from '@/lib/game/customers/types';
import { CustomerCard } from './CustomerCard';

interface WaitingAreaProps {
  customers: Customer[];
}

export function WaitingArea({ customers }: WaitingAreaProps) {
  const waitingCustomers = customers.filter(c => c.status === CustomerStatus.Waiting);
  const leavingCustomers = customers.filter(c => c.status === CustomerStatus.LeavingAngry);

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Waiting Area</h4>
        <div className="text-xs text-gray-500">{waitingCustomers.length} waiting</div>
      </div>
      
      <div className="space-y-3">
        {/* Show angry customers who are leaving */}
        {leavingCustomers.map((customer) => (
          <div key={customer.id} className="opacity-80">
            <CustomerCard customer={customer} />
          </div>
        ))}
        
        {/* Show waiting customers */}
        {waitingCustomers.map((customer) => (
          <CustomerCard 
            key={customer.id} 
            customer={customer} 
            showPatience={true}
          />
        ))}
      </div>
    </div>
  );
}
