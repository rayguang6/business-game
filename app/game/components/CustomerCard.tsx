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
      <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
        {/* Row 1: Avatar + Service info + Status icon */}
        <div className="flex items-center gap-2 mb-1">
          {/* Avatar inside card */}
          <div className="w-5 h-5 rounded overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
            <img 
              src={customer.imageSrc} 
              alt="avatar" 
              className="w-5 h-5" 
              style={{ 
                objectFit: 'none', 
                objectPosition: '0 0',
                width: '20px',
                height: '20px'
              }} 
            />
          </div>
          
          {/* Service info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800 text-xs truncate">{customer.service.name}</div>
            <div className="text-xs text-gray-600">${customer.service.price}</div>
          </div>

          {/* Status icon in top right */}
          <div className="flex-shrink-0">
            {customer.status === CustomerStatus.Waiting && (
              <span className="text-yellow-600 text-sm">⏳</span>
            )}
            {customer.status === CustomerStatus.InService && (
              <span className="text-blue-600 text-sm">🔧</span>
            )}
            {customer.status === CustomerStatus.LeavingAngry && (
              <span className="text-red-600 text-sm">😡</span>
            )}
          </div>
        </div>
      
        {/* Row 2: Patience Bar (for waiting customers) */}
        {showPatience && customer.status === CustomerStatus.Waiting && (
          <div className="mt-1">
            {(() => {
              const progress = getPatienceProgress(customer);
              return (
                <div className="flex items-center gap-2">
                  <span className="text-xs">{getPatienceEmoji(progress)}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1">
                    <div
                      key={`patience-${customer.id}`}
                      className={`${getPatienceColor(progress)} h-1 rounded-full transition-all duration-300`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{Math.ceil(ticksToSeconds(customer.patienceLeft))}s</span>
                </div>
              );
            })()}
          </div>
        )}
      
        {/* Row 2: Service Progress Bar (for in-service customers) */}
        {showServiceProgress && customer.status === CustomerStatus.InService && (
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-600">🔧</span>
              <div className="flex-1 bg-gray-200 rounded-full h-1">
                <div
                  key={`progress-${customer.id}-${customer.serviceTimeLeft}`}
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${getServiceProgress(customer)}%` }}
                />
              </div>
              <span className="text-xs text-blue-600 font-medium">{Math.ceil(ticksToSeconds(customer.serviceTimeLeft))}s</span>
            </div>
          </div>
        )}
      
        {/* Row 2: Angry Message (for leaving customers) */}
        {customer.status === CustomerStatus.LeavingAngry && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-red-600">😡</span>
            <span className="text-xs text-red-600 font-medium">Reputation -1</span>
          </div>
        )}
      </div>

  );
}
