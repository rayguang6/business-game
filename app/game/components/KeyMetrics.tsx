'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export function KeyMetrics() {
  const { metrics, weeklyHistory } = useGameStore();
  const last = weeklyHistory.length > 0 ? weeklyHistory[weeklyHistory.length - 1] : null;

  const metricsData = [
    {
      icon: '💰',
      value: `$${metrics.cash}`,
      label: 'Cash',
      color: 'text-green-600'
    },
    {
      icon: '📈',
      value: `$${last ? last.revenue : 0}`,
      label: 'Revenue',
      color: 'text-purple-600'
    },
    {
      icon: '📉',
      value: `$${last ? last.expenses : 0}`,
      label: 'Expenses',
      color: 'text-red-600'
    },
    {
      icon: '⭐',
      value: metrics.reputation.toString(),
      label: 'Reputation',
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="px-2 py-0.5 h-10">
      <div className="flex items-center justify-around gap-0.5 h-full">
        {metricsData.map((metric, index) => (
          <div key={index} className="flex items-center gap-0.5 px-1 py-0.5 bg-white/10 backdrop-blur-sm rounded border border-white/20 flex-1 h-8">
            <span className="text-xs">{metric.icon}</span>
            <div className="text-left min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate leading-tight">{metric.value}</div>
              <div className="text-xs text-white truncate leading-tight">{metric.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


