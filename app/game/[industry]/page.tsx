'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useAudio } from '@/hooks/useAudio';
import { TopBar } from '@/app/game/components/ui/TopBar';
import { GameCanvas } from '@/app/game/components/canvas/GameCanvas';
import { HomeTab } from '@/app/game/components/tabs/HomeTab';
import { StaffTab } from '@/app/game/components/tabs/StaffTab';
import { FinanceTab } from '@/app/game/components/tabs/FinanceTab';
import { UpgradesTab } from '@/app/game/components/tabs/UpgradesTab';
import { MarketingTab } from '@/app/game/components/tabs/MarketingTab';
import { TabType, TAB_CONFIGS } from '@/lib/types/ui';
import { useAudioControls } from '@/hooks/useAudio';
import { FullscreenToggle } from '@/app/game/components/ui/FullscreenToggle';

export default function GamePage() {
  const gameStore = useGameStore();
  const { selectedIndustry, isGameStarted, startGame, isPaused, unpauseGame, resetAllGame } = gameStore;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { audioState, setVolume, toggleMute } = useAudioControls();
  
  // Play game music when component mounts
  useAudio('game', true);
  
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

  const openSettings = () => {
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    unpauseGame();
  };

  const quitGame = () => {
    // Reset all game state and navigate home
    resetAllGame();
    setSettingsOpen(false);
    router.push('/');
  };

  if (!selectedIndustry) {
    return null; // Return null while redirecting
  }

  return (
    <div id="game-shell" className="h-screen relative flex flex-col md:flex-row overflow-hidden">
      
      
      {/* Mobile: Top Section - Game Canvas Area (50% height) */}
      {/* Desktop: Left Section - Game Canvas Area (50% width) */}
      <div className="relative h-1/2 md:h-full md:w-1/2 flex items-center justify-center">
        {/* TopBar Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <TopBar onSettingsOpen={openSettings} />
        </div>

        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30">
          <FullscreenToggle targetId="game-shell" />
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

      {/* Settings Modal - Top Level */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-80 p-5 max-h-[90vh] overflow-y-auto mx-4">
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
    </div>
  );
}