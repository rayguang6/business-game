'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { CustomerStatus, Customer } from '@/lib/game/customers/types';
import { TICKS_PER_SECOND, ticksToSeconds } from '@/lib/game/core/constants';
import { TopBar } from '@/app/game/components/TopBar';
import { KeyMetrics } from '@/app/game/components/KeyMetrics';
import { FinancePNL } from '@/app/game/components/FinancePNL';
import { GameCanvas } from '@/app/game/components/GameCanvas';

export default function GamePage() {
  const { selectedIndustry, isGameStarted, isPaused, metrics, weeklyRevenue, weeklyExpenses, weeklyHistory, gameTime, currentWeek, customers, startGame, pauseGame, unpauseGame } = useGameStore();
  const router = useRouter();
  
  // Progress logic moved into GameCanvas component
  
  // Initialize game loop
  useGameLoop();

  useEffect(() => {
    if (!selectedIndustry) {
      router.push('/');
    } else if (!isGameStarted) {
      // Auto-start the game when page loads
      startGame();
    }
  }, [selectedIndustry, router, isGameStarted, startGame]);

  if (!selectedIndustry) {
    return null; // Return null while redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
      {/* Top HUD Section */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b-2 border-gray-200">f
        <TopBar />
        <KeyMetrics />
      </div>

      {/* Middle Canvas Section */}
      <div className="bg-gradient-to-b from-blue-100 to-blue-200">
        <GameCanvas />
      </div>

      {/* PNL Section - scrollable content */}
      <div className="bg-white/90 backdrop-blur-sm border-t-2 border-gray-200">
        <div className="px-4 py-2">
          <FinancePNL />
        </div>
      </div>

      {/* Fixed Bottom Navigation Menu */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t-2 border-gray-200">
        <div className="flex items-center justify-around py-3 px-4">
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-1"></div>
            <span className="text-xs font-semibold text-gray-700">Staff</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-green-500 rounded-lg mx-auto mb-1"></div>
            <span className="text-xs font-semibold text-gray-700">Upgrades</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg mx-auto mb-1"></div>
            <span className="text-xs font-semibold text-gray-700">Stats</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-purple-500 rounded-lg mx-auto mb-1"></div>
            <span className="text-xs font-semibold text-gray-700">Marketing</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-red-500 rounded-lg mx-auto mb-1"></div>
            <span className="text-xs font-semibold text-gray-700">Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
}