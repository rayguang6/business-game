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
import { TabType, TAB_CONFIGS } from '@/lib/types/ui';

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
    <div className="h-screen relative flex flex-col md:flex-row overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/game-screen-bg.png')"
        }}
      />
      
      {/* Mobile: Top Section - Game Canvas Area (50% height) */}
      {/* Desktop: Left Section - Game Canvas Area (50% width) */}
      <div className="relative h-1/2 md:h-full md:w-1/2 flex items-center justify-center">
        {/* TopBar Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <TopBar />
        </div>
        
        {/* Game Canvas - Full Area */}
        <div className="relative z-10 w-full h-full bg-gray-800 flex items-center justify-center">
          <GameCanvas />
        </div>
      </div>

      {/* Mobile: Bottom Section - Navigation & Tabs (50% height) */}
      {/* Desktop: Right Section - Navigation & Tabs (50% width) */}
      <div className="relative z-20 bg-gray-900 border-t-2 md:border-t-0 md:border-l-2 border-gray-700 h-1/2 md:h-full md:w-1/2 flex flex-col overflow-hidden">
        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'staff' && <StaffTab />}
          {activeTab === 'finance' && <FinanceTab />}
          {activeTab === 'home' && <HomeTab />}
          {activeTab === 'upgrades' && <UpgradesTab />}
          {activeTab === 'marketing' && <MarketingTab />}
        </div>
        
        {/* Bottom Navigation - Contained within right side only */}
        <div className="relative z-30 bg-gray-900 border-t-2 border-gray-700 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-around">
            {TAB_CONFIGS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`relative flex flex-col items-center transition-all duration-200 
                  ${activeTab === tab.id ? 'scale-110' : 'hover:scale-105'}`}
              >
                {/* Icon with subtle active state */}
                <div className={`p-1 rounded-xl transition-all duration-200 ${
                  tab.isHome 
                    ? 'bg-gradient-to-br from-yellow-200 to-yellow-400 p-2 rounded-full' 
                    : activeTab === tab.id 
                      ? 'bg-gray-100/50 rounded-full' 
                      : ''
                }`}>
                  <img 
                    src={tab.icon} 
                    alt={tab.label}
                    width={tab.isHome ? 48 : 32}
                    height={tab.isHome ? 48 : 32}
                    className={`mx-auto transition-all duration-200 ${
                      activeTab === tab.id && !tab.isHome 
                        ? 'brightness-110 contrast-110' 
                        : ''
                    }`}
                  />
                </div>
                
                {/* Label */}
                <span className={`text-xs font-semibold mt-1 
                  ${activeTab === tab.id ? tab.activeColor : 'text-gray-300'}`}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}