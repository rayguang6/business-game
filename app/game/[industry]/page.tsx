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
          {activeTab === 'staff' && (
            <div>
              <h3 className="text-lg font-bold mb-3 text-white">Staff Management</h3>
              <p className="text-gray-300">Manage your employees and their performance.</p>
            </div>
          )}
          
          {activeTab === 'finance' && (
            <div>
              <h3 className="text-lg font-bold mb-3 text-white">Financial Overview</h3>
              <FinancePNL />
            </div>
          )}
          
          {activeTab === 'home' && (
            <div>
              <h3 className="text-lg font-bold mb-3 text-white">Business Overview</h3>
              <p className="text-gray-300 mb-6">View your business performance and key metrics.</p>
              
              {/* Test content to enable scrolling */}
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Weekly Performance</h4>
                  <p className="text-gray-300 text-sm">Your business is performing well this week with steady customer flow.</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Customer Satisfaction</h4>
                  <p className="text-gray-300 text-sm">High satisfaction rates from your patients.</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Revenue Trends</h4>
                  <p className="text-gray-300 text-sm">Revenue is trending upward this month.</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Staff Performance</h4>
                  <p className="text-gray-300 text-sm">Your staff is working efficiently and maintaining quality service.</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Equipment Status</h4>
                  <p className="text-gray-300 text-sm">All equipment is in good working condition.</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Marketing Impact</h4>
                  <p className="text-gray-300 text-sm">Current marketing campaigns are bringing in new customers.</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Future Plans</h4>
                  <p className="text-gray-300 text-sm">Consider expanding your services to increase revenue potential.</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'upgrades' && (
            <div>
              <h3 className="text-lg font-bold mb-3 text-white">Equipment Upgrades</h3>
              <p className="text-gray-300">Upgrade your equipment to improve efficiency.</p>
            </div>
          )}
          
          {activeTab === 'marketing' && (
            <div>
              <h3 className="text-lg font-bold mb-3 text-white">Marketing Campaigns</h3>
              <p className="text-gray-300">Launch marketing campaigns to attract more customers.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation - Full width, no background image visible */}
      <div className="relative z-20">
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}