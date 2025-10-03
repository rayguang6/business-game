'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { KeyMetrics } from './KeyMetrics';
import { ROUND_DURATION_SECONDS } from '@/lib/core/constants';
import { useAudioControls } from '@/hooks/useAudio';

export function TopBar() {
  const { selectedIndustry, isPaused, unpauseGame, pauseGame, gameTime, currentWeek, resetAllGame } = useGameStore();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const { audioState, setVolume, toggleMute } = useAudioControls();

  if (!selectedIndustry) return null;

  const progressPct = ((gameTime % ROUND_DURATION_SECONDS) / ROUND_DURATION_SECONDS) * 100;

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
      <div className="flex items-center px-2 md:px-4 py-1 md:py-2 h-14 md:h-16 mt-4">
        
        {/* Left Section: Industry Details and Progress (50% width) */}
        <div className="flex items-center w-1/2 pr-1 md:pr-2">
          {/* Circular Industry Image */}
          <button
            onClick={openSettings}
            className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 p-0.5 md:p-1 hover:opacity-80 transition-opacity flex-shrink-0 -mr-3 md:-mr-4 z-10"
          >
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {selectedIndustry.image ? (
                <img 
                  src={selectedIndustry.image} 
                  alt={selectedIndustry.name}
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
            <div className="flex items-center bg-gradient-to-r from-blue-600 to-blue-600/40 py-0.5 pl-4 md:pl-6 pr-0.5 md:pr-1">
              <div className="text-stroke text-stroke-thin text-white mr-0.5 md:mr-1 flex-shrink-0 text-xs md:text-sm">{selectedIndustry.icon}</div>
              <span className="text-stroke text-stroke-thin text-white font-bold text-[12px] md:text-sm truncate">{selectedIndustry.name}</span>
              <span className="text-stroke text-stroke-thin text-white font-bold text-[10px] md:text-[12px] ml-1 md:ms-2 flex-shrink-0">(Stage 1)</span>
            </div>
            
            {/* Progress Section */}
            <div className="flex items-center space-x-0.5 md:space-x-1 bg-black/45 py-0.5 pl-4 md:pl-6">
              <span className="text-stroke text-stroke-thin text-yellow-400 text-[10px] md:text-xs font-bold flex-shrink-0">Week {currentWeek}</span>
              <div className="w-1/2 bg-gray-600 rounded-xs h-1 md:h-1.5 overflow-hidden flex-shrink-0">
                <div 
                  className="bg-green-500 h-1 md:h-1.5 rounded-xs transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-stroke text-stroke-thin text-white text-[8px] md:text-[10px] leading-none font-bold flex-shrink-0">{ROUND_DURATION_SECONDS-Math.floor(gameTime % ROUND_DURATION_SECONDS)}s</div>
            </div>
          </div>
        </div>

        {/* Right Section: Key Metrics (50% width) */}
        <div className="w-1/2 pl-1 md:pl-2">
          <KeyMetrics />
        </div>
      </div>

      {/* Settings Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-80 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Settings</h2>
            <p className="text-sm text-gray-600 mb-4">Game is paused while settings are open.</p>
            
            {/* Audio Controls */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Audio Settings</h3>
              
              {/* Mute Toggle */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Music</span>
                <button
                  onClick={toggleMute}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    audioState.isMuted 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {audioState.isMuted ? '🔇 Muted' : '🔊 On'}
                </button>
              </div>
              
              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioState.volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={audioState.isMuted}
                />
                <span className="text-xs text-gray-500 w-8">
                  {Math.round(audioState.volume * 100)}%
                </span>
              </div>
            </div>
            
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


