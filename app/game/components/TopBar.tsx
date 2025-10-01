'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { KeyMetrics } from './KeyMetrics';

export function TopBar() {
  const { selectedIndustry, isPaused, unpauseGame, pauseGame, gameTime, currentWeek, resetAllGame } = useGameStore();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  if (!selectedIndustry) return null;

  const progressPct = ((gameTime % 30) / 30) * 100;

  const openSettings = () => {
    pauseGame();
    setOpen(true);
  };

  const closeSettings = () => {
    setOpen(false);
    unpauseGame();
  };

  const quitGame = () => {
    // Reset all game state and navigate home
    resetAllGame();
    setOpen(false);
    router.push('/');
  };

  return (
    <>
      {/* Main TopBar Container */}
      <div className="flex items-center px-4 py-2 h-16">
        
        {/* Left Section: Industry Details and Progress (50% width) */}
        <div className="flex items-center w-1/2 pr-2">
          {/* Circular Industry Image */}
          <button
            onClick={openSettings}
            className="relative w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 p-1 hover:opacity-80 transition-opacity flex-shrink-0 -mr-4 z-10"
          >
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {selectedIndustry.image ? (
                <img 
                  src={selectedIndustry.image} 
                  alt={selectedIndustry.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-2xl">{selectedIndustry.icon}</div>
              )}
            </div>
          </button>

          {/* Industry Banner and Progress */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Industry Banner */}
            <div className="flex items-center bg-gradient-to-r from-blue-600/60 to-blue-600/20 py-0.5 rounded pl-6 pr-1">
              <div className="text-white mr-1 flex-shrink-0 text-sm">{selectedIndustry.icon}</div>
              <span className="text-white font-bold text-xs truncate">{selectedIndustry.name}</span>
              <span className="text-white font-bold text-[8px] ms-2 flex-shrink-0">(STAGE 1)</span>
            </div>
            
            {/* Progress Section */}
            <div className="flex items-center space-x-1 bg-black/45 py-0.5 pl-6">
              <span className="text-yellow-400 text-xs font-semibold flex-shrink-0">Week {currentWeek}</span>
              <div className="w-1/2 bg-gray-600 rounded-xs h-1.5 overflow-hidden flex-shrink-0">
                <div 
                  className="bg-green-500 h-1.5 rounded-xs transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-300 leading-none font-bold flex-shrink-0">{30-Math.floor(gameTime % 30)}s</div>
            </div>
          </div>
        </div>

        {/* Right Section: Key Metrics (50% width) */}
        <div className="w-1/2 pl-2">
          <KeyMetrics />
        </div>
      </div>

      {/* Settings Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-80 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Settings</h2>
            <p className="text-sm text-gray-600 mb-4">Game is paused while settings are open.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={quitGame}
                className="w-full text-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Quit Game (Back to Home)
              </button>
              <button
                onClick={closeSettings}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close & Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


