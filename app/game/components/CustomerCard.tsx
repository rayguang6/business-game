'use client';

import React from 'react';
import { Customer, CustomerStatus } from '@/lib/game/customers/types';
import { TICKS_PER_SECOND, ticksToSeconds } from '@/lib/game/core/constants';
import { DEFAULT_PATIENCE_SECONDS } from '@/lib/game/customers/config';

interface CustomerCardProps {
  customer: Customer;
  showPatience?: boolean;
  showServiceProgress?: boolean;
}

export function CustomerCard({ customer, showPatience = false, showServiceProgress = false }: CustomerCardProps) {
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
    <div className="flex items-start gap-2">
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
        
        {/* Status Badge */}
        <div className="mb-2">
          {customer.status === CustomerStatus.Waiting && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Waiting</span>
          )}
          {customer.status === CustomerStatus.InService && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">🔧 In Service</span>
          )}
          {customer.status === CustomerStatus.LeavingAngry && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">😡 Left Angry</span>
          )}
        </div>
        
        {/* Patience Bar (for waiting customers) */}
        {showPatience && customer.status === CustomerStatus.Waiting && (
          <div>
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
        )}
        
        {/* Service Progress Bar (for in-service customers) */}
        {showServiceProgress && customer.status === CustomerStatus.InService && (
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
        )}
        
        {/* Angry Message (for leaving customers) */}
        {customer.status === CustomerStatus.LeavingAngry && (
          <div className="text-xs text-red-600 font-medium">Reputation -1</div>
        )}
      </div>
    </div>
  );
}
