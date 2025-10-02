'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { ROUND_DURATION_SECONDS } from '@/lib/core/constants';

export function WeekProgress() {
  const { gameTime, currentWeek } = useGameStore();

  return (
    <div className="bg-white rounded-lg p-4 mb-6 shadow-lg">
      <div className="text-center">
        <div className="text-3xl font-bold text-indigo-600 mb-2">Week {currentWeek}</div>
        <div className="text-sm text-gray-600 mb-3">Business Week Progress</div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${((gameTime % ROUND_DURATION_SECONDS) / ROUND_DURATION_SECONDS) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {Math.floor(gameTime % ROUND_DURATION_SECONDS)}s / {ROUND_DURATION_SECONDS}s (Week {currentWeek})
        </div>
      </div>
    </div>
  );
}


