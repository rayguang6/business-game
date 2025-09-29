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
      <div className="grid grid-cols-3 items-center mb-8 gap-3">
        {/* Left: Industry */}
        <div className="flex items-center space-x-3">
          <div className="text-3xl">{selectedIndustry.icon}</div>
          <div className="hidden sm:block">
            <h1 className="text-3xl font-bold text-gray-800">{selectedIndustry.name}</h1>
            <p className="text-gray-600 text-sm">Manage your business</p>
          </div>
          <div className="sm:hidden text-lg font-semibold text-gray-800">{selectedIndustry.name}</div>
        </div>

        {/* Middle: Week progress */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold whitespace-nowrap text-sm sm:text-base">
            <span>Week {currentWeek}</span>
            <div className="w-24 sm:w-40 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-500 h-2" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-gray-500 text-xs">{Math.floor(gameTime % 30)}s</span>
          </div>
        </div>

        {/* Right: Settings button */}
        <div className="flex items-center justify-end">
          <button
            onClick={openSettings}
            className="px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            aria-label="Open settings"
          >
            ⚙️ Settings
          </button>
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


