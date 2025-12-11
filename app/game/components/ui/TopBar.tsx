'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { useConfigStore } from '@/lib/store/configStore';
import { DEFAULT_INDUSTRY_ID, getBusinessStats } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { useAudioControls } from '@/hooks/useAudio';
import Image from 'next/image';

interface TopBarProps {
  onSettingsOpen: () => void;
}

export function TopBar({ onSettingsOpen }: TopBarProps) {
  const { selectedIndustry, isPaused, unpauseGame, pauseGame, gameTime, currentMonth, username } = useGameStore();
  const configStatus = useConfigStore((state) => state.configStatus);

  if (!selectedIndustry) return null;

  const industryId = (selectedIndustry.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  
  // Check if config is ready before accessing business stats
  const stats = getBusinessStats(industryId);
  if (!stats || configStatus !== 'ready') {
    // Config not ready yet - render minimal UI without progress bar
    return (
      <div className="flex items-center h-auto min-h-[3rem] sm:min-h-[4rem] md:min-h-[5rem]">
        <div className="flex items-center w-full pr-1 sm:pr-2 md:pr-3">
          <button
            onClick={() => {
              pauseGame();
              onSettingsOpen();
            }}
            className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 p-0.5 sm:p-0.5 md:p-1 hover:opacity-80 transition-opacity flex-shrink-0 -mr-3 sm:-mr-4 md:-mr-6 z-10"
          >
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {selectedIndustry.image ? (
                <Image
                  src={selectedIndustry.image}
                  alt={selectedIndustry.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-sm sm:text-base md:text-2xl">{selectedIndustry.icon}</div>
              )}
            </div>
          </button>
          <div className="flex flex-col flex-1 min-w-0 bg-gradient-to-r from-blue-600 to-blue-600/40 rounded-md overflow-hidden">
            <div className="flex items-center py-0.5 sm:py-1 md:py-1.5 pl-2 sm:pl-3 md:pl-8 pr-1 sm:pr-2">
              <div className="text-white mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0 text-body-sm sm:text-body md:text-heading-sm">{selectedIndustry.icon}</div>
              <span className="text-white font-bold text-body-sm sm:text-body md:text-heading-sm">{selectedIndustry.name}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const roundDurationSeconds = stats.monthDurationSeconds;
  const progressPct = ((gameTime % roundDurationSeconds) / roundDurationSeconds) * 100;

  const openSettings = () => {
    pauseGame();
    onSettingsOpen();
  };

  return (
    <>
      {/* Main TopBar Container */}
      <div className="flex items-center h-auto min-h-[3rem] sm:min-h-[4rem] md:min-h-[5rem]">
        
        {/* Left Section: Industry Details and Progress (100% width) */}
        <div className="flex items-center w-full pr-1 sm:pr-2 md:pr-3">
          {/* Circular Industry Image */}
          <button
            onClick={openSettings}
            className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 p-0.5 sm:p-0.5 md:p-1 hover:opacity-80 transition-opacity flex-shrink-0 -mr-3 sm:-mr-4 md:-mr-6 z-10"
          >
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {selectedIndustry.image ? (
                <Image
                  src={selectedIndustry.image}
                  alt={selectedIndustry.name}
                  width={64} // Set a reasonable default that will scale with the parent
                  height={64} // Set a reasonable default that will scale with the parent
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-sm sm:text-base md:text-2xl">{selectedIndustry.icon}</div>
              )}
            </div>
          </button>

          {/* Industry Banner and Progress with Unified Background */}
          <div className="flex flex-col flex-1 min-w-0 bg-gradient-to-r from-blue-600 to-blue-600/40 rounded-md overflow-hidden">
            {/* Industry Banner */}
            <div className="flex items-center py-0.5 sm:py-1 md:py-1.5 pl-2 sm:pl-3 md:pl-8 pr-1 sm:pr-2">
              <div className="text-white mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0 text-body-sm sm:text-body md:text-heading-sm">{selectedIndustry.icon}</div>
              <span className="text-white font-bold text-body-sm sm:text-body md:text-heading-sm">{selectedIndustry.name}</span>
              <span className="text-white/90 font-semibold text-body-sm sm:text-body md:text-heading-sm ml-1 sm:ml-1.5 md:ml-2 flex-shrink-0">(Stage 1)</span>
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

