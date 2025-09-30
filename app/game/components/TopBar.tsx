'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';

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
        <div className="flex items-center justify-between px-2 py-1 h-12">
        {/* Left: Industry Profile (Clickable for Settings) */}
            <button
              onClick={openSettings}
              className="flex items-center space-x-1 hover:bg-white/10 rounded px-1 py-0.5 transition-colors"
            >
              <div className="text-lg">{selectedIndustry.icon}</div>
              <div className="text-left">
                <h1 className="text-xs font-bold text-white">{selectedIndustry.name}</h1>
                <p className="text-gray-300 text-xs">⚙️</p>
              </div>
            </button>

            {/* Right: Week Progress */}
            <div className="flex items-center space-x-1">
              <div className="text-right">
                <div className="text-xs font-bold text-white">W{currentWeek}</div>
                <div className="text-xs text-gray-300">{Math.floor(gameTime % 30)}s</div>
              </div>
              
              {/* Simple Progress Bar */}
              <div className="w-12 bg-gray-600 rounded-full h-1 overflow-hidden">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
      </div>

      {/* Settings Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
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


