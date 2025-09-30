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
    <div className="px-4 py-2">
      <div className="flex items-center justify-around">
        {metricsData.map((metric, index) => (
          <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <span className="text-lg">{metric.icon}</span>
            <div className="text-left">
              <div className="text-sm font-bold text-white">{metric.value}</div>
              <div className="text-xs text-white">{metric.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


