'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export function KeyMetrics() {
  const { metrics, weeklyHistory } = useGameStore();
  const last = weeklyHistory.length > 0 ? weeklyHistory[weeklyHistory.length - 1] : null;

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
      value: (last ? last.revenue : 0).toLocaleString(),
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
      value: (last ? last.expenses : 0).toLocaleString(),
      label: 'Expenses',
      color: 'text-red-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
      {metricsData.map((metric, index) => (
        <div key={index} className="flex items-center bg-black/45 py-0.5 px-1 rounded relative w-full">
          {/* Icon positioned outside from the left */}
          <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center z-10 overflow-hidden">
            {metric.image ? (
              <img 
                src={metric.image} 
                alt={metric.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-sm transform rotate-5">{metric.icon}</span>
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1 pl-2 ms-2">
            <span className={`text-[10px] font-bold ${metric.color} truncate`}>
              {metric.label}
            </span>
            <span className="text-white text-[10px] font-bold truncate">
              {metric.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}


