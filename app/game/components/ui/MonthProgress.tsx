'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { useConfigStore } from '@/lib/store/configStore';
import { DEFAULT_INDUSTRY_ID, getRoundDurationSecondsForIndustry } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';

export function MonthProgress() {
  const { gameTime, currentMonth, selectedIndustry } = useGameStore();
  const configStatus = useConfigStore((state) => state.configStatus);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  
  // Safely get round duration - handle case when config isn't loaded yet
  let roundDurationSeconds = 0;
  try {
    if (configStatus === 'ready') {
      roundDurationSeconds = getRoundDurationSecondsForIndustry(industryId);
    }
  } catch (error) {
    console.warn('[MonthProgress] Error accessing config, using defaults', error);
  }
  const timeIntoMonth =
    roundDurationSeconds > 0 ? Math.floor(gameTime % roundDurationSeconds) : 0;
  const progress =
    roundDurationSeconds > 0 ? (timeIntoMonth / roundDurationSeconds) * 100 : 0;

  return (
    <div className="bg-white rounded-lg px-3 py-2 mb-6 shadow-lg w-fit">
      <div className="text-center">
        <div className="text-sm text-gray-500">
          {timeIntoMonth}s / {roundDurationSeconds}s (Month {currentMonth})
        </div>
      </div>
    </div>
  );
}
