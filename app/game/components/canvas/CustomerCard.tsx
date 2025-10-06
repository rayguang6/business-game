'use client';

import React from 'react';
import { Customer, CustomerStatus } from '@/lib/features/customers';
import { TICKS_PER_SECOND, ticksToSeconds } from '@/lib/game/config';
import { DEFAULT_PATIENCE_SECONDS } from '@/lib/features/customers';

interface CustomerCardProps {
  customer: Customer;
  showPatience?: boolean;
  showServiceProgress?: boolean;
  scaleFactor: number;
}

export function CustomerCard({ customer, showPatience = false, showServiceProgress = false, scaleFactor }: CustomerCardProps) {
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
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200"
        style={{
          padding: `${8 * scaleFactor}px`,
          borderRadius: `${8 * scaleFactor}px`
        }}
      >
        {/* Row 1: Avatar + Service info + Status icon */}
        <div 
          className="flex items-center gap-2 mb-1"
          style={{ gap: `${8 * scaleFactor}px` }}
        >
          {/* Avatar inside card */}
          <div 
            className="rounded overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0"
            style={{
              width: `${20 * scaleFactor}px`,
              height: `${20 * scaleFactor}px`,
              borderRadius: `${4 * scaleFactor}px`
            }}
          >
            <img 
              src={customer.imageSrc} 
              alt="avatar" 
              style={{ 
                objectFit: 'none', 
                objectPosition: '0 0',
                width: `${20 * scaleFactor}px`,
                height: `${20 * scaleFactor}px`
              }} 
            />
          </div>
          
          {/* Service info */}
          <div className="flex-1 min-w-0">
            <div 
              className="font-medium text-gray-800 truncate"
              style={{ fontSize: `${12 * scaleFactor}px` }}
            >
              {customer.service.name}
            </div>
            <div 
              className="text-gray-600"
              style={{ fontSize: `${10 * scaleFactor}px` }}
            >
              ${customer.service.price}
            </div>
          </div>

          {/* Status icon in top right */}
          <div className="flex-shrink-0">
            {customer.status === CustomerStatus.Waiting && (
              <span 
                className="text-yellow-600"
                style={{ fontSize: `${14 * scaleFactor}px` }}
              >
                ⏳
              </span>
            )}
            {customer.status === CustomerStatus.InService && (
              <span 
                className="text-blue-600"
                style={{ fontSize: `${14 * scaleFactor}px` }}
              >
                🔧
              </span>
            )}
            {customer.status === CustomerStatus.LeavingAngry && (
              <span 
                className="text-red-600"
                style={{ fontSize: `${14 * scaleFactor}px` }}
              >
                😡
              </span>
            )}
          </div>
        </div>
      
        {/* Row 2: Patience Bar (for waiting customers) */}
        {showPatience && customer.status === CustomerStatus.Waiting && (
          <div className="mt-1">
            {(() => {
              const progress = getPatienceProgress(customer);
              return (
                <div 
                  className="flex items-center"
                  style={{ 
                    gap: `${8 * scaleFactor}px`,
                    marginTop: `${4 * scaleFactor}px`
                  }}
                >
                  <span 
                    style={{ fontSize: `${12 * scaleFactor}px` }}
                  >
                    {getPatienceEmoji(progress)}
                  </span>
                  <div 
                    className="flex-1 bg-gray-200 rounded-full"
                    style={{ 
                      height: `${4 * scaleFactor}px`,
                      borderRadius: `${2 * scaleFactor}px`
                    }}
                  >
                    <div
                      key={`patience-${customer.id}`}
                      className={`${getPatienceColor(progress)} rounded-full transition-all duration-300`}
                      style={{ 
                        width: `${progress}%`,
                        height: `${4 * scaleFactor}px`
                      }}
                    />
                  </div>
                  <span 
                    className="text-gray-600"
                    style={{ fontSize: `${10 * scaleFactor}px` }}
                  >
                    {Math.ceil(ticksToSeconds(customer.patienceLeft))}s
                  </span>
                </div>
              );
            })()}
          </div>
        )}
      
        {/* Row 2: Service Progress Bar (for in-service customers) */}
        {showServiceProgress && customer.status === CustomerStatus.InService && (
          <div className="mt-1">
            <div 
              className="flex items-center"
              style={{ 
                gap: `${8 * scaleFactor}px`,
                marginTop: `${4 * scaleFactor}px`
              }}
            >
              <span 
                className="text-blue-600"
                style={{ fontSize: `${12 * scaleFactor}px` }}
              >
                🔧
              </span>
              <div 
                className="flex-1 bg-gray-200 rounded-full"
                style={{ 
                  height: `${4 * scaleFactor}px`,
                  borderRadius: `${2 * scaleFactor}px`
                }}
              >
                <div
                  key={`progress-${customer.id}-${customer.serviceTimeLeft}`}
                  className="bg-blue-500 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${getServiceProgress(customer)}%`,
                    height: `${4 * scaleFactor}px`
                  }}
                />
              </div>
              <span 
                className="text-blue-600 font-medium"
                style={{ fontSize: `${10 * scaleFactor}px` }}
              >
                {Math.ceil(ticksToSeconds(customer.serviceTimeLeft))}s
              </span>
            </div>
          </div>
        )}
      
        {/* Row 2: Angry Message (for leaving customers) */}
        {customer.status === CustomerStatus.LeavingAngry && (
          <div 
            className="flex items-center"
            style={{ 
              gap: `${8 * scaleFactor}px`,
              marginTop: `${4 * scaleFactor}px`
            }}
          >
            <span 
              className="text-red-600"
              style={{ fontSize: `${12 * scaleFactor}px` }}
            >
              😡
            </span>
            <span 
              className="text-red-600 font-medium"
              style={{ fontSize: `${10 * scaleFactor}px` }}
            >
              Reputation -1
            </span>
          </div>
        )}
      </div>

  );
}
