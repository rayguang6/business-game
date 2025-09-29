'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export function KeyMetrics() {
  const { metrics, weeklyHistory } = useGameStore();
  const last = weeklyHistory.length > 0 ? weeklyHistory[weeklyHistory.length - 1] : null;

  return (
    <div className="bg-white rounded-lg p-4 mb-6 shadow-lg">
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600">${metrics.cash}</div>
          <div className="text-sm text-gray-600">Cash</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">${last ? last.revenue : 0}</div>
          <div className="text-sm text-gray-600">Last Week Revenue</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">${last ? last.expenses : 0}</div>
          <div className="text-sm text-gray-600">Last Week Expenses</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">{metrics.reputation}</div>
          <div className="text-sm text-gray-600">Total Reputation</div>
        </div>
      </div>
    </div>
  );
}


