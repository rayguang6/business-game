'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { useConfigStore } from '@/lib/store/configStore';
import { KeyMetrics } from './KeyMetrics';
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
      <div className="flex items-center px-0.5 sm:px-1 md:px-4 py-0.5 sm:py-1 md:py-2 pt-2 sm:pt-3 md:pt-4 h-auto min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[4rem] mt-1 sm:mt-2 md:mt-4">
        <div className="flex items-center w-[40%] pr-0.5 sm:pr-1 md:pr-2 min-w-0 overflow-hidden">
          <button
            onClick={() => {
              pauseGame();
              onSettingsOpen();
            }}
            className="relative w-6 h-6 sm:w-8 sm:h-8 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 p-0.5 sm:p-0.5 md:p-1 hover:opacity-80 transition-opacity flex-shrink-0 -mr-1.5 sm:-mr-2 md:-mr-4 z-10"
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
                <div className="text-sm sm:text-sm md:text-2xl">{selectedIndustry.icon}</div>
              )}
            </div>
          </button>
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center bg-gradient-to-r from-blue-600 to-blue-600/40 py-0.5 sm:py-0.5 md:py-1 pl-1.5 sm:pl-2 md:pl-6 pr-0.5 sm:pr-1 overflow-hidden">
              <div className="text-white mr-0.5 sm:mr-0.5 md:mr-1.5 flex-shrink-0 text-ultra-sm sm:text-caption md:text-sm">{selectedIndustry.icon}</div>
              <span className="text-white font-bold text-ultra-sm sm:text-caption md:text-sm truncate">{selectedIndustry.name}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 pl-0.5 sm:pl-0.5 md:pl-2 min-w-0 mt-1 sm:mt-1.5 md:mt-3">
          <KeyMetrics />
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
      <div className="flex items-center px-0.5 sm:px-1 md:px-4 py-0.5 sm:py-1 md:py-2 pt-2 sm:pt-3 md:pt-4 h-auto min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[4rem] mt-1 sm:mt-2 md:mt-4">
        
        {/* Left Section: Industry Details and Progress (40% width) */}
        <div className="flex items-center w-[40%] pr-0.5 sm:pr-1 md:pr-2 min-w-0 overflow-hidden">
          {/* Circular Industry Image */}
          <button
            onClick={openSettings}
            className="relative w-6 h-6 sm:w-8 sm:h-8 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 p-0.5 sm:p-0.5 md:p-1 hover:opacity-80 transition-opacity flex-shrink-0 -mr-1.5 sm:-mr-2 md:-mr-4 z-10"
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
                <div className="text-sm sm:text-sm md:text-2xl">{selectedIndustry.icon}</div>
              )}
            </div>
          </button>

          {/* Industry Banner and Progress */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Industry Banner */}
            <div className="flex items-center bg-gradient-to-r from-blue-600 to-blue-600/40 py-0.5 sm:py-0.5 md:py-1 pl-1.5 sm:pl-2 md:pl-6 pr-0.5 sm:pr-1 overflow-hidden">
              <div className="text-white mr-0.5 sm:mr-0.5 md:mr-1.5 flex-shrink-0 text-ultra-sm sm:text-caption md:text-sm">{selectedIndustry.icon}</div>
              <span className="text-white font-bold text-ultra-sm sm:text-caption md:text-sm truncate">{selectedIndustry.name}</span>
              <span className="text-white/90 font-semibold text-micro sm:text-ultra-sm md:text-sm ml-0.5 sm:ml-1 md:ml-2 flex-shrink-0">(Stage 1)</span>
            </div>
            
            
            {/* Progress Section */}
            <div className="flex items-center gap-0.5 sm:gap-0.5 md:gap-1.5 bg-black/45 py-0.5 sm:py-0.5 md:py-1 pl-1.5 sm:pl-2 md:pl-6 overflow-hidden">
              <span className="text-yellow-400 text-micro sm:text-caption md:text-sm font-bold flex-shrink-0 whitespace-nowrap">Month {currentMonth}</span>
              <div className="w-10 sm:w-16 md:w-28 bg-gray-600 rounded-full h-0.5 sm:h-1 md:h-2 overflow-hidden flex-shrink-0">
                <div 
                  className="bg-green-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-white text-micro sm:text-ultra-sm md:text-sm leading-none font-bold flex-shrink-0 whitespace-nowrap">
                {roundDurationSeconds - Math.floor(gameTime % roundDurationSeconds)}s
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Key Metrics (60% width) */}
        <div className="flex-1 pl-0.5 sm:pl-0.5 md:pl-2 min-w-0 mt-1 sm:mt-1.5 md:mt-3">
          <KeyMetrics />
        </div>
      </div>
    </>
  );
}

