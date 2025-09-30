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
      
      {/* Top HUD Section */}
      <div className="relative z-10">
        <TopBar />
        <KeyMetrics />
      </div>

      {/* Middle Canvas Section */}
      <div className="relative z-10">
        <GameCanvas />
      </div>

      {/* Tab Content Area - Takes remaining space */}
      <div className="relative z-10 flex-1 min-h-0 bg-gray-900 border-t-2 border-gray-700">
        <div className="h-full overflow-y-auto px-6 py-6 pb-24">
          {activeTab === 'staff' && <StaffTab />}
          
          {activeTab === 'finance' && <FinanceTab />}
          
          {activeTab === 'home' && <HomeTab />}
          
          {activeTab === 'upgrades' && <UpgradesTab />}
          
          {activeTab === 'marketing' && <MarketingTab />}
        </div>
      </div>

      {/* Bottom Navigation - Full width, no background image visible */}
      <div className="relative z-20">
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}