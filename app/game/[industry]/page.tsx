'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { CustomerStatus, Customer } from '@/lib/game/customers/types';
import { TICKS_PER_SECOND, ticksToSeconds } from '@/lib/game/core/constants';
import { TopBar } from '@/app/game/components/TopBar';
import { KeyMetrics } from '@/app/game/components/KeyMetrics';
import { FinancePNL } from '@/app/game/components/FinancePNL';
import { GameCanvas } from '@/app/game/components/GameCanvas';
import BottomNavigation from '@/app/components/ui/BottomNavigation';

type TabType = 'staff' | 'finance' | 'home' | 'upgrades' | 'marketing';

export default function GamePage() {
  const { selectedIndustry, isGameStarted, isPaused, metrics, weeklyRevenue, weeklyExpenses, weeklyHistory, gameTime, currentWeek, customers, startGame, pauseGame, unpauseGame } = useGameStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  
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
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 relative pb-20">
      
      {/* Top HUD Section */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-sky-400  to-blue-600 relative">
        <TopBar />
        <KeyMetrics />
      </div>

      {/* Middle Canvas Section */}
      <div className="bg-gradient-to-b from-blue-100 to-blue-200">
        <GameCanvas />
      </div>

      {/* Tab Content Area */}
      <div className="bg-white/90 backdrop-blur-sm border-t-2 border-gray-200">
        <div className="px-4 py-4">
          {activeTab === 'staff' && (
            <div>
              <h3 className="text-lg font-bold mb-3">Staff Management</h3>
              <p className="text-gray-600">Manage your employees and their performance.</p>
            </div>
          )}
          
          {activeTab === 'finance' && (
            <div>
              <h3 className="text-lg font-bold mb-3">Financial Overview</h3>
              <FinancePNL />
            </div>
          )}
          
          {activeTab === 'home' && (
            <div>
              <h3 className="text-lg font-bold mb-3">Business Overview</h3>
              <p className="text-gray-600">View your business performance and key metrics.</p>
            </div>
          )}
          
          {activeTab === 'upgrades' && (
            <div>
              <h3 className="text-lg font-bold mb-3">Equipment Upgrades</h3>
              <p className="text-gray-600">Upgrade your equipment to improve efficiency.</p>
            </div>
          )}
          
          {activeTab === 'marketing' && (
            <div>
              <h3 className="text-lg font-bold mb-3">Marketing Campaigns</h3>
              <p className="text-gray-600">Launch marketing campaigns to attract more customers.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}