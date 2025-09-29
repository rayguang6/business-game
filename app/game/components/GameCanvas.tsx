'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { Customer, CustomerStatus } from '@/lib/game/customers/types';
import { TICKS_PER_SECOND, ticksToSeconds } from '@/lib/game/core/constants';
import { DEFAULT_PATIENCE_SECONDS } from '@/lib/game/customers/config';

export function GameCanvas() {
  const { selectedIndustry, customers } = useGameStore();

  if (!selectedIndustry) return null;

  const getServiceProgress = (customer: Customer) => {
    const totalTicks = customer.service.duration * TICKS_PER_SECOND;
    const elapsedTicks = totalTicks - customer.serviceTimeLeft;
    const progress = Math.max(0, Math.min(100, (elapsedTicks / totalTicks) * 100));
    return progress;
  };

  const getPatienceProgress = (customer: Customer) => {
    const progress = Math.max(0, Math.min(100, (customer.patienceLeft / customer.maxPatience) * 100));
    return progress;
  };

  const getPatienceColor = (progress: number) => {
    if (progress > 60) return 'bg-green-500'; // Good patience
    if (progress > 30) return 'bg-yellow-500'; // Getting impatient
    return 'bg-red-500'; // Very impatient
  };

  const getPatienceEmoji = (progress: number) => {
    if (progress > 60) return '😊'; // Happy
    if (progress > 30) return '😐'; // Neutral
    return '😠'; // Angry
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-xl">
      <div className="text-center">
        <div className="text-6xl mb-4">{selectedIndustry.icon}</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Welcome to your {selectedIndustry.name.toLowerCase()}!
        </h2>
        <p className="text-gray-600 mb-6">{selectedIndustry.description}</p>

        <div className="relative bg-gray-100 rounded-lg min-h-96 border-2 border-dashed border-gray-300 mb-6 p-4">
          <div className="flex items-start gap-4 h-full">
            {/* Waiting Area */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Waiting Area</h4>
                <div className="text-xs text-gray-500">{customers.filter((c) => c.status === CustomerStatus.Waiting).length} waiting</div>
              </div>
                      <div className="space-y-3">
                        {/* Show angry customers who are leaving */}
                        {customers.filter((c) => c.status === CustomerStatus.LeavingAngry).map((customer) => (
                          <div key={customer.id} className="flex items-start gap-2 opacity-80">
                            {/* Avatar */}
                            <div className="mt-1 w-8 h-8 rounded overflow-hidden bg-red-100 shadow-sm border border-red-200 flex items-center justify-center">
                              <span className="text-lg">😡</span>
                            </div>
                            {/* Card */}
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 shadow-md w-full">
                              <div className="border-b border-red-200 pb-2 mb-2">
                                <div className="font-semibold text-gray-800 text-sm">{customer.service.name}</div>
                                <div className="flex justify-between items-center text-xs text-red-600">
                                  <span>${customer.service.price}</span>
                                  <span>{customer.service.duration}s</span>
                                </div>
                              </div>
                              <div className="mb-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">😡 Left Angry</span>
                              </div>
                              <div className="text-xs text-red-600 font-medium">Reputation -1</div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Show waiting customers */}
                        {customers.filter((c) => c.status === CustomerStatus.Waiting).map((customer) => (
                  <div key={customer.id} className="flex items-start gap-2">
                    {/* Avatar */}
                    <div className="mt-1 w-8 h-8 rounded overflow-hidden bg-white shadow-sm border border-gray-200 flex items-center justify-center">
                      <img 
                        src={customer.imageSrc} 
                        alt="avatar" 
                        className="w-8 h-8" 
                        style={{ 
                          objectFit: 'none', 
                          objectPosition: '0 0',
                          width: '32px',
                          height: '32px'
                        }} 
                      />
                    </div>
                    {/* Card */}
                    <div className="bg-white rounded-xl p-3 shadow-md border border-gray-200 w-full">
                      <div className="border-b border-gray-100 pb-2 mb-2">
                        <div className="font-semibold text-gray-800 text-sm">{customer.service.name}</div>
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>${customer.service.price}</span>
                          <span>{customer.service.duration}s</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Waiting</span>
                      </div>
                      {(() => {
                        const progress = getPatienceProgress(customer);
                        return (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-1">
                                <span className="text-sm">{getPatienceEmoji(progress)}</span>
                                <span className="text-xs text-gray-600">Patience</span>
                              </div>
                              <span className="text-xs text-gray-600 font-medium">{Math.ceil(ticksToSeconds(customer.patienceLeft))}s</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                key={`patience-${customer.id}`}
                                className={`${getPatienceColor(progress)} h-2 rounded-full transition-all duration-300`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-gray-200 self-stretch" />

            {/* Treatment Room */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Treatment Room</h4>
                <div className="text-xs text-gray-500">{customers.filter((c) => c.status === CustomerStatus.InService).length}/2 in service</div>
              </div>
              <div className="space-y-3">
                {customers.filter((c) => c.status === CustomerStatus.InService).map((customer) => (
                  <div key={customer.id} className="flex items-start gap-2">
                    {/* Avatar */}
                    <div className="mt-1 w-8 h-8 rounded overflow-hidden bg-white shadow-sm border border-gray-200 flex items-center justify-center">
                      <img 
                        src={customer.imageSrc} 
                        alt="avatar" 
                        className="w-8 h-8" 
                        style={{ 
                          objectFit: 'none', 
                          objectPosition: '0 0',
                          width: '32px',
                          height: '32px'
                        }} 
                      />
                    </div>
                    {/* Card */}
                    <div className="bg-white rounded-xl p-3 shadow-md border border-gray-200 w-full">
                      <div className="border-b border-gray-100 pb-2 mb-2">
                        <div className="font-semibold text-gray-800 text-sm">{customer.service.name}</div>
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>${customer.service.price}</span>
                          <span>{customer.service.duration}s</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">🔧 In Service</span>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600">Service Progress</span>
                          <span className="text-xs text-blue-600 font-medium">{Math.ceil(ticksToSeconds(customer.serviceTimeLeft))}s</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            key={`progress-${customer.id}-${customer.serviceTimeLeft}`}
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getServiceProgress(customer)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


