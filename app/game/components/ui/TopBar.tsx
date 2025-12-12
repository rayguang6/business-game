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
  const { selectedIndustry, isPaused, unpauseGame, pauseGame, gameTime, currentMonth, username, metrics } = useGameStore();
  const configStatus = useConfigStore((state) => state.configStatus);

  // All hooks must be called before any conditional returns or logic
  const [rankChangeKey, setRankChangeKey] = useState(0); // For animation triggers
  const previousRankRef = useRef('Unknown Rank');

  if (!selectedIndustry) return null;

  const industryId = (selectedIndustry.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

  // Get current level
  const expPerLevel = getExpPerLevel(industryId);
  const currentLevel = getLevel(metrics.exp, expPerLevel);

  // Get level rank from already-loaded level rewards
  const levelRewards = getLevelRewardsFromStore(industryId);
  const currentLevelReward = levelRewards.find(reward => reward.level === currentLevel);
  const currentRank = currentLevelReward?.rank || 'Unknown Rank';

  // Get all unique ranks in order (based on first appearance in level rewards)
  const allRanks = Array.from(new Set(levelRewards.map(r => r.rank).filter(Boolean))).filter(Boolean) as string[];

  // Detect rank changes for animation (use ref to avoid state dependencies)
  useEffect(() => {
    if (previousRankRef.current !== currentRank) {
      previousRankRef.current = currentRank;
      setRankChangeKey(prev => prev + 1);
    }
  }, [currentRank]);

  // Check if config is ready before accessing business stats
  const stats = getBusinessStats(industryId);
  if (!stats || configStatus !== 'ready') {
    // Config not ready yet - render minimal UI without progress bar

    return (
      <div className="flex items-center h-auto min-h-[3rem] sm:min-h-[4rem] md:min-h-[5rem]">
        <div className="flex items-center w-full pr-1 sm:pr-2 md:pr-3">
          <div className="flex flex-col flex-1 min-w-0 bg-gradient-to-r from-blue-600 to-blue-600/40 rounded-md overflow-hidden">
            <div className="flex items-center py-0.5 sm:py-1 md:py-1.5 pl-2 sm:pl-3 pr-1 sm:pr-2">
              <div className="text-white mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0 text-body-sm sm:text-body md:text-heading-sm">{selectedIndustry.icon}</div>
              <span className="text-white font-bold text-body-sm sm:text-body md:text-heading-sm">{selectedIndustry.name}</span>
              <span
                key={rankChangeKey}
                className={`font-semibold text-body-sm sm:text-body md:text-heading-sm ml-1 sm:ml-1.5 md:ml-2 flex-shrink-0 px-2 py-0.5 rounded-md transition-all duration-300 ease-out transform ${getRankBackgroundColor(currentRank, allRanks)} ${getRankTextColor(currentRank, allRanks)}`}
                style={{
                  animation: rankChangeKey > 0 ? 'rankPulse 0.3s ease-out' : undefined,
                }}
              >
                {currentRank}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const roundDurationSeconds = stats.monthDurationSeconds;
  const progressPct = ((gameTime % roundDurationSeconds) / roundDurationSeconds) * 100;

  return (
    <>
      {/* Main TopBar Container */}
      <div className="flex items-center h-auto min-h-[3rem] sm:min-h-[4rem] md:min-h-[5rem]">
        
        {/* Left Section: Industry Details and Progress (100% width) */}
        <div className="flex items-center w-full pr-1 sm:pr-2 md:pr-3">
          {/* Industry Banner and Progress with Unified Background */}
          <div className="flex flex-col flex-1 min-w-0 bg-gradient-to-r from-blue-600 to-blue-600/40 rounded-md overflow-hidden">
            {/* Industry Banner */}
            <div className="flex items-center py-0.5 sm:py-1 md:py-1.5 pl-2 sm:pl-3 pr-1 sm:pr-2">
              <div className="text-white mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0 text-body-sm sm:text-body md:text-heading-sm">{selectedIndustry.icon}</div>
              <span className="text-white font-bold text-body-sm sm:text-body md:text-heading-sm">{selectedIndustry.name}</span>
              <span
                key={rankChangeKey}
                className={`font-semibold text-body-sm sm:text-body md:text-heading-sm ml-1 sm:ml-1.5 md:ml-2 flex-shrink-0 px-2 py-0.5 rounded-md transition-all duration-300 ease-out transform ${getRankBackgroundColor(currentRank, allRanks)} ${getRankTextColor(currentRank, allRanks)}`}
                style={{
                  animation: rankChangeKey > 0 ? 'rankPulse 0.3s ease-out' : undefined,
                }}
              >
                {currentRank}
              </span>
            </div>

            {/* Progress Section */}
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-black/45 py-0.5 sm:py-1 md:py-1.5 pl-2 sm:pl-3 md:pl-8 pr-1 sm:pr-2">
              <span className="text-yellow-400 text-body-sm sm:text-body md:text-heading-sm font-bold flex-shrink-0 whitespace-nowrap">Month {currentMonth}</span>
              <div className="w-20 sm:w-28 md:w-40 bg-gray-600 rounded-full h-1.5 sm:h-2 md:h-2.5 overflow-hidden flex-shrink-0">
                <div
                  className="bg-green-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-white text-body-sm sm:text-body md:text-heading-sm leading-none font-bold flex-shrink-0 whitespace-nowrap">
                {roundDurationSeconds - Math.floor(gameTime % roundDurationSeconds)}s
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

