'use client';

import React from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';

export function KeyMetrics() {
  const { metrics, lastWeek } = useFinanceData();

  const metricsData = [
    {
      icon: '💎',
      image: '/images/icons/finance.png',
      value: metrics.cash.toLocaleString(),
      label: 'Cash',
      color: 'text-green-400'
    },
    {
      icon: '💎',
      image: '/images/icons/home.png',
      value: (lastWeek ? lastWeek.revenue : 0).toLocaleString(),
      label: 'Revenue',
      color: 'text-blue-400'
    },
    {
      icon: '💎',
      image: '/images/icons/marketing.png',
      value: metrics.reputation.toLocaleString(),
      label: 'Reputation',
      color: 'text-yellow-400'
    },
    {
      icon: '💎',
      image: '/images/icons/staff.png',
      value: (lastWeek ? lastWeek.expenses : 0).toLocaleString(),
      label: 'Expenses',
      color: 'text-red-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-y-1 md:gap-y-2 gap-x-2 md:gap-x-4">
      {metricsData.map((metric, index) => (
        <div key={index} className="flex items-center bg-black/65 py-0.5 md:py-0.5 px-0.5 md:px-1 rounded relative w-full">
          {/* Icon positioned outside from the left */}
          <div className="absolute -left-2 md:-left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center z-10 overflow-hidden">
            {metric.image ? (
              <img 
                src={metric.image} 
                alt={metric.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xs md:text-sm transform rotate-5">{metric.icon}</span>
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1 pl-1.5 md:pl-2">
            <span className={`text-stroke text-stroke-thin text-[8px] md:text-[10px] font-bold ${metric.color} truncate`}>
              {metric.label}
            </span>
            <span className="text-stroke text-stroke-thin text-white text-[9px] md:text-[11px] font-bold truncate">
              {metric.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}


