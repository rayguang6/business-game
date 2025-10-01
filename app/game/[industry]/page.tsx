'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { CustomerStatus, Customer } from '@/lib/game/customers/types';
import { TICKS_PER_SECOND, ticksToSeconds } from '@/lib/game/core/constants';
import { TopBar } from '@/app/game/components/TopBar';
import { FinancePNL } from '@/app/game/components/FinancePNL';
import { GameCanvas } from '@/app/game/components/GameCanvas';
import { HomeTab } from '@/app/game/components/HomeTab';
import { StaffTab } from '@/app/game/components/StaffTab';
import { FinanceTab } from '@/app/game/components/FinanceTab';
import { UpgradesTab } from '@/app/game/components/UpgradesTab';
import { MarketingTab } from '@/app/game/components/MarketingTab';
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
    <div className="h-screen relative flex flex-col overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/game-screen-bg.png')"
        }}
      />
      
      {/* Top Section - Game Canvas Area (50% height) */}
      <div className="relative h-1/2 flex items-center justify-center">
        {/* TopBar Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <TopBar />
        </div>
        
        {/* Game Canvas - Full Area */}
        <div className="relative z-10 w-full h-full bg-gray-800 flex items-center justify-center">
          <GameCanvas />
        </div>
      </div>

      {/* Bottom Section - Navigation & Tabs (50% height) */}
      <div className="relative z-20 bg-gray-900 border-t-2 border-gray-700 h-1/2 flex flex-col">
        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 pb-20">
          {activeTab === 'staff' && <StaffTab />}
          {activeTab === 'finance' && <FinanceTab />}
          {activeTab === 'home' && <HomeTab />}
          {activeTab === 'upgrades' && <UpgradesTab />}
          {activeTab === 'marketing' && <MarketingTab />}
        </div>
        
        {/* Bottom Navigation */}
        <div className="relative z-30">
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
}