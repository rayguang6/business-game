'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { KeyMetrics } from './KeyMetrics';
import { DEFAULT_INDUSTRY_ID, getRoundDurationSecondsForIndustry } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { useAudioControls } from '@/hooks/useAudio';
import Image from 'next/image';

interface TopBarProps {
  onSettingsOpen: () => void;
}

export function TopBar({ onSettingsOpen }: TopBarProps) {
  const { selectedIndustry, isPaused, unpauseGame, pauseGame, gameTime, currentMonth } = useGameStore();

  if (!selectedIndustry) return null;

  const industryId = (selectedIndustry.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const roundDurationSeconds = getRoundDurationSecondsForIndustry(industryId);
  const progressPct = ((gameTime % roundDurationSeconds) / roundDurationSeconds) * 100;

  const openSettings = () => {
    pauseGame();
    onSettingsOpen();
  };

  return (
    <>
      {/* Main TopBar Container */}
      <div className="flex items-center px-2 md:px-4 py-1 md:py-2 h-14 md:h-16 mt-4">
        
        {/* Left Section: Industry Details and Progress (40% width) */}
        <div className="flex items-center w-[40%] pr-1 md:pr-2">
          {/* Circular Industry Image */}
          <button
            onClick={openSettings}
            className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 p-0.5 md:p-1 hover:opacity-80 transition-opacity flex-shrink-0 -mr-3 md:-mr-4 z-10"
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
                <div className="text-lg md:text-2xl">{selectedIndustry.icon}</div>
              )}
            </div>
          </button>

          {/* Industry Banner and Progress */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Industry Banner */}
            <div className="flex items-center bg-gradient-to-r from-blue-600 to-blue-600/40 py-1 pl-4 md:pl-6 pr-1">
              <div className="text-white mr-1 md:mr-1.5 flex-shrink-0 text-xs md:text-sm">{selectedIndustry.icon}</div>
              <span className="text-white font-bold text-xs md:text-sm truncate">{selectedIndustry.name}</span>
              <span className="text-white/90 font-semibold text-[10px] md:text-xs ml-1.5 md:ml-2 flex-shrink-0">(Stage 1)</span>
            </div>
            
            {/* Progress Section */}
            <div className="flex items-center gap-1 md:gap-1.5 bg-black/45 py-1 pl-4 md:pl-6">
              <span className="text-yellow-400 text-[11px] md:text-xs font-bold flex-shrink-0 whitespace-nowrap">Month {currentMonth}</span>
              <div className="w-20 md:w-28 bg-gray-600 rounded-full h-1.5 md:h-2 overflow-hidden flex-shrink-0">
                <div 
                  className="bg-green-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-white text-[10px] md:text-xs leading-none font-bold flex-shrink-0 whitespace-nowrap">
                {roundDurationSeconds - Math.floor(gameTime % roundDurationSeconds)}s
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Key Metrics (60% width) */}
        <div className="flex-1 pl-1 md:pl-2 min-w-0 mt-3">
          <KeyMetrics />
        </div>
      </div>
    </>
  );
}

