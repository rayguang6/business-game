'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { DEFAULT_INDUSTRY_ID, getRoundDurationSecondsForIndustry } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';

export function WeekProgress() {
  const { gameTime, currentWeek, selectedIndustry } = useGameStore();
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const roundDurationSeconds = getRoundDurationSecondsForIndustry(industryId);
  const timeIntoWeek =
    roundDurationSeconds > 0 ? Math.floor(gameTime % roundDurationSeconds) : 0;
  const progress =
    roundDurationSeconds > 0 ? (timeIntoWeek / roundDurationSeconds) * 100 : 0;

  return (
    <div className="bg-white rounded-lg p-4 mb-6 shadow-lg">
      <div className="text-center">
        <div className="text-3xl font-bold text-indigo-600 mb-2">Week {currentWeek}</div>
        <div className="text-sm text-gray-600 mb-3">Business Week Progress</div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {timeIntoWeek}s / {roundDurationSeconds}s (Week {currentWeek})
        </div>
      </div>
    </div>
  );
}
