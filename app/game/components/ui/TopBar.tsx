'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { useConfigStore } from '@/lib/store/configStore';
import { DEFAULT_INDUSTRY_ID, getBusinessStats, getExpPerLevel } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { getLevel, getRankBackgroundColor, getRankTextColor } from '@/lib/store/types';
import { getLevelRewardsFromStore } from '@/lib/store/configStore';
import { useAudioControls } from '@/hooks/useAudio';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

export function TopBar() {
  // 🔒 HOOKS FIRST — ALWAYS
  const {
    selectedIndustry,
    isPaused,
    unpauseGame,
    pauseGame,
    gameTime,
    currentMonth,
    username,
    metrics,
  } = useGameStore();

  const configStatus = useConfigStore((state) => state.configStatus);

  const [rankChangeKey, setRankChangeKey] = useState(0);
  const previousRankRef = useRef('Unknown Rank');

  // Calculate values needed for useEffect (before early return)
  const industryId = selectedIndustry ? (selectedIndustry.id ?? DEFAULT_INDUSTRY_ID) as IndustryId : null;
  const expPerLevel = industryId ? getExpPerLevel(industryId) : 200;
  const currentLevel = getLevel(metrics.exp, expPerLevel);
  const levelRewards = industryId ? getLevelRewardsFromStore(industryId) : [];
  const currentLevelReward = levelRewards.find(
    reward => reward.level === currentLevel
  );
  const currentRank = configStatus === 'ready' && currentLevelReward?.rank ? currentLevelReward.rank : 'Rank';

  const allRanks = Array.from(
    new Set(levelRewards.map(r => r.rank).filter(Boolean))
  ) as string[];

  useEffect(() => {
    if (previousRankRef.current !== currentRank) {
      previousRankRef.current = currentRank;
      setRankChangeKey(prev => prev + 1);
    }
  }, [currentRank]);

  // 🧱 GUARD AFTER HOOKS
  if (!selectedIndustry) return null;

  // After guard, we know selectedIndustry exists, so industryId is guaranteed to be a string
  const industryIdAfterGuard = (selectedIndustry.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const stats = getBusinessStats(industryIdAfterGuard);

  if (!stats || configStatus !== 'ready') {
    return (
      <div className="flex items-center h-auto min-h-[3rem] sm:min-h-[4rem] md:min-h-[5rem]">
        <div className="flex items-center w-full pr-1 sm:pr-2 md:pr-3">
          <div className="flex flex-col flex-1 min-w-0 bg-gradient-to-r from-blue-600 to-blue-600/40 rounded-md overflow-hidden">
            <div className="flex items-center py-0.5 sm:py-1 md:py-1.5 pl-2 sm:pl-3 pr-1 sm:pr-2">
            <div className="text-white mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0 text-body-sm sm:text-body md:text-heading-sm">{selectedIndustry.icon}</div>
            <span className="text-white font-bold text-body-sm sm:text-body md:text-heading-sm">{selectedIndustry.name}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const roundDurationSeconds = stats.monthDurationSeconds;
  const progressPct =
    ((gameTime % roundDurationSeconds) / roundDurationSeconds) * 100;

  return (
    <div className="flex items-center h-auto min-h-[3rem] sm:min-h-[4rem] md:min-h-[5rem]">
      <div className="flex items-center w-full pr-1 sm:pr-2 md:pr-3">
        <div className="flex flex-col flex-1 min-w-0 bg-gradient-to-r from-blue-600 to-blue-600/40 rounded-md overflow-hidden">
          {/* Industry Banner */}
          <div className="flex items-center p-0.5 sm:p-1 md:p-1.5 px-3">
            <div className="text-white mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0 text-body-sm sm:text-body md:text-heading-sm">{selectedIndustry.icon}</div>
            <span className="text-white font-bold text-body-sm sm:text-body md:text-heading-sm">{selectedIndustry.name}</span>
          </div>

          {/* Progress Section */}
          <div className="flex flex-col bg-black/45 p-0.5 sm:p-1 md:p-1.5 px-3">
            <div className="flex items-center justify-between">
              <span className="text-yellow-400 text-body-sm sm:text-body md:text-heading-sm font-bold flex-shrink-0 whitespace-nowrap">Month {currentMonth}</span>
              <div className="text-white text-body-sm sm:text-body md:text-heading-sm leading-none font-bold flex-shrink-0 whitespace-nowrap">
                {roundDurationSeconds - Math.floor(gameTime % roundDurationSeconds)}s
              </div>
            </div>

            {/* Thin progress indicator */}
            <div className="w-full bg-gray-600 h-0.5 rounded-full overflow-hidden mt-0.5">
              <div
                className="bg-green-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

