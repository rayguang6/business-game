'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CustomerStatus } from '@/lib/game/customers/types';
import { TICKS_PER_SECOND, ticksToSeconds } from '@/lib/game/core/constants';

export function GameCanvas() {
  const { selectedIndustry, customers } = useGameStore();

  if (!selectedIndustry) return null;

  const getServiceProgress = (customer: any) => {
    const totalTicks = customer.service.duration * TICKS_PER_SECOND;
    const elapsedTicks = totalTicks - customer.serviceTimeLeft;
    const progress = Math.max(0, Math.min(100, (elapsedTicks / totalTicks) * 100));
    return progress;
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-xl">
      <div className="text-center">
        <div className="text-6xl mb-4">{selectedIndustry.icon}</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Welcome to your {selectedIndustry.name.toLowerCase()}!
        </h2>
        <p className="text-gray-600 mb-6">{selectedIndustry.description}</p>

        <div className="relative bg-gray-100 rounded-lg h-96 border-2 border-dashed border-gray-300 mb-6">
          <div className="absolute top-4 left-4 text-sm text-gray-500">
            Total: {customers.length} | Waiting: {customers.filter((c) => c.status === CustomerStatus.Waiting).length} | In Service: {customers.filter((c) => c.status === CustomerStatus.InService).length}
          </div>
          <div className="absolute top-4 right-4 text-sm text-gray-500">
            Capacity: {customers.filter((c) => c.status === CustomerStatus.InService).length}/2
          </div>

          {customers.map((customer) => (
            <div key={customer.id} className="absolute" style={{ left: `${customer.x}px`, top: `${customer.y}px` }}>
              <div className="text-4xl mb-1">{customer.emoji}</div>
              <div className="bg-white rounded-lg p-2 shadow-lg border text-xs min-w-[120px]">
                <div className="font-semibold text-gray-800">{customer.service.name}</div>
                <div className="text-gray-600">${customer.service.price}</div>
                <div className="text-gray-500">{customer.service.duration}s</div>
                <div className="text-xs text-gray-400 mt-1">Status: {customer.status}</div>
                {customer.status === CustomerStatus.InService && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        key={`progress-${customer.id}-${customer.serviceTimeLeft}`}
                        className="bg-blue-500 h-1 rounded-full"
                        style={{ width: `${getServiceProgress(customer)}%` }}
                      />
                    </div>
                    <div className="text-xs text-blue-600 mt-1">{Math.ceil(ticksToSeconds(customer.serviceTimeLeft))}s remaining</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


