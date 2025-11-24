'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useAudio } from '@/hooks/useAudio';
import { TopBar } from '@/app/game/components/ui/TopBar';
import { GameCanvas } from '@/app/game/components/canvas/GameCanvas';
import { HomeTab } from '@/app/game/components/tabs/HomeTab';
import { UpgradesTab } from '@/app/game/components/tabs/UpgradesTab';
import { MarketingTab } from '@/app/game/components/tabs/MarketingTab';
import { TabType, TAB_CONFIGS } from '@/lib/types/ui';
import { useAudioControls } from '@/hooks/useAudio';
import { FullscreenToggle } from '@/app/game/components/ui/FullscreenToggle';
import EventPopup from '@/app/game/components/ui/EventPopup';
import GameOverPopup from '@/app/game/components/ui/GameOverPopup';
import { FlagDebug } from '@/app/game/components/ui/FlagDebug';
import { TierMultiplierDebug } from '@/app/game/components/ui/TierMultiplierDebug';
import { useRandomEventTrigger } from '@/hooks/useRandomEventTrigger';
import Image from 'next/image';
import { IndustryId } from '@/lib/game/types';
import GameButton from '@/app/components/ui/GameButton';
import {
  loadGlobalSimulationSettings,
  loadIndustryContent,
} from '@/lib/game/simulationConfigService';
import { useConfigStore } from '@/lib/store/configStore';

export default function GamePage() {
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const isGameStarted = useGameStore((state) => state.isGameStarted);
  const startGame = useGameStore((state) => state.startGame);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const unpauseGame = useGameStore((state) => state.unpauseGame);
  const resetAllGame = useGameStore((state) => state.resetAllGame);
  const setAvailableConditions = useGameStore((state) => state.setAvailableConditions);
  const setAvailableFlags = useGameStore((state) => state.setAvailableFlags);
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { audioState, setVolume, toggleMute } = useAudioControls();
  const [globalConfigReady, setGlobalConfigReady] = useState(false);
  const [dataLoadState, setDataLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const initializeStaffForIndustry = useGameStore((state) => state.initializeStaffForIndustry);
  const setGlobalConfigState = useConfigStore((state) => state.setGlobalConfig);
  const setIndustryConfigState = useConfigStore((state) => state.setIndustryConfig);
  const setConfigStatus = useConfigStore((state) => state.setConfigStatus);
  

  // Play game music when component mounts
  useAudio('game', true);

  useEffect(() => {
    let isMounted = true;

    setConfigStatus('loading');

    (async () => {
      try {
        const globalConfig = await loadGlobalSimulationSettings();
        if (!isMounted) {
          return;
        }

        if (globalConfig) {
          setGlobalConfigState(globalConfig);
        }
      } catch (error) {
        console.error('Failed to load global simulation config', error);
        if (isMounted) {
          setConfigStatus('error', 'Failed to load global simulation config');
        }
      } finally {
        if (isMounted) {
          setGlobalConfigReady(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [setConfigStatus, setGlobalConfigState]);

  useEffect(() => {
    let isMounted = true;

    // Check if selectedIndustry exists and has an id property
    if (!selectedIndustry?.id || !globalConfigReady) {
      setDataLoadState('idle');
      return () => {
        isMounted = false;
      };
    }

    setDataLoadState('loading');
    setConfigStatus('loading');

    (async () => {
      const industryId = selectedIndustry.id as IndustryId;
      try {
        const content = await loadIndustryContent(industryId);

        if (!isMounted) {
          return;
        }

        if (!content) {
          throw new Error('Industry content load failed');
        }

        const { services, upgrades, events, flags, conditions, marketingCampaigns, staffDataAvailable, staffRoles } = content;

        const hasServices = services.length > 0;
        const hasUpgrades = upgrades.length > 0;
        const hasEvents = events.length > 0;
        const hasStaff = !staffDataAvailable || (staffRoles?.length ?? 0) > 0;
        const hasConditions = conditions.length > 0;
        const hasFlags = flags.length > 0;

        setIndustryConfigState(industryId, content);

        if (!staffDataAvailable) {
          console.warn('[Staff] No staff data available for industry', industryId);
        }

        initializeStaffForIndustry(industryId);

        // Set conditions and flags regardless of whether they exist (empty array is fine)
        setAvailableConditions(conditions);
        setAvailableFlags(flags);

        if (hasServices && hasUpgrades && hasEvents && hasStaff) {
          setDataLoadState('ready');
          setConfigStatus('ready');
        } else {
          console.error('Missing industry data', {
            industry: industryId,
            hasServices,
            hasUpgrades,
            hasEvents,
            hasStaff,
            hasConditions,
          });
          setDataLoadState('error');
          setConfigStatus('error', 'Missing required industry data');
        }
      } catch (err) {
        console.error('Failed to load industry data', err);
        if (isMounted) {
          setDataLoadState('error');
          setConfigStatus('error', err instanceof Error ? err.message : 'Failed to load industry data');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [
    selectedIndustry,
    initializeStaffForIndustry,
    globalConfigReady,
    setAvailableConditions,
    setAvailableFlags,
    setConfigStatus,
    setIndustryConfigState,
  ]);

  // Guard to check if industry exists; otherwise redirect. If game is selected but not started, kick it off.
  useEffect(() => {
    if (!selectedIndustry) {
      if (pathname !== '/') {
        router.push('/');
      }
    } else if (!isGameStarted && dataLoadState === 'ready') {
      // Auto-start the game when page loads
      startGame();
    }
  }, [selectedIndustry, isGameStarted, startGame, pathname, router, dataLoadState]);

  // Initialize game loop
  useGameLoop();

  // Trigger random events for the active game; this is the only component that should call it.
  useRandomEventTrigger();

  const openSettings = () => {
    pauseGame();
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
  };

  if (!selectedIndustry) {
    return null; // Return null while redirecting
  }

  if (dataLoadState === 'loading' || dataLoadState === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-lg font-semibold">
        Loading industry data...
      </div>
    );
  }

  if (dataLoadState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-900 text-white text-center px-6">
        <p className="text-2xl font-semibold">Industry data unavailable</p>
        <p className="text-base max-w-md text-gray-300">
          We couldn&apos;t load the required data for this industry. Please check your Supabase data and try again.
        </p>
        <button
          onClick={() => router.push('/select-industry')}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition-colors"
        >
          Back to industry selection
        </button>
      </div>
    );
  }

  if (!audioState) {
    return null;
  }

  return (
    <div id="game-shell" className="h-screen relative flex flex-col md:flex-row overflow-hidden">
      
      
      {/* Mobile: Top Section - Game Canvas Area (flexible height) */}
      {/* Desktop: Left Section - Game Canvas Area (50% width) */}
      <div className="relative md:h-full md:w-1/2 flex items-center justify-center py-4 md:py-0">
        {/* TopBar Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <TopBar onSettingsOpen={openSettings} />
        </div>

        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-30">
          {/* Fullscreen toggle anchored bottom-right */}
          <FullscreenToggle targetId="game-shell" />
        </div>
        
        {/* Game Canvas - Full Area */}
        <div className="relative z-10 w-full h-full bg-gray-800 flex items-center justify-center">
          <GameCanvas />
          <EventPopup />
          <GameOverPopup />
          {process.env.NODE_ENV === 'development' && (
            <>
              <FlagDebug />
              <TierMultiplierDebug />
            </>
          )}
        </div>
      </div>

      {/* Mobile: Bottom Section - Navigation & Tabs (flexible height) */}
      {/* Desktop: Right Section - Navigation & Tabs (50% width) */}
      <div className="relative z-20 bg-gray-900 border-t-2 md:border-t-0 md:border-l-2 border-gray-700 flex-1 md:h-full md:w-1/2 flex flex-col overflow-hidden">
        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          {activeTab === 'home' && <HomeTab />}
          {activeTab === 'upgrades' && <UpgradesTab />}
          {activeTab === 'marketing' && <MarketingTab />}
        </div>
        
        {/* Bottom Navigation - SurvivorIO style full-width sections */}
        <div className="relative z-30 bg-black/90 border-t border-gray-800 flex-shrink-0">
          <div className="flex h-full">
            {TAB_CONFIGS.map((tab) => {
              const isActive = activeTab === tab.id;
              const tabColor = tab.activeColor === 'text-purple-600' ? '#9333ea' : 
                              tab.activeColor === 'text-yellow-600' ? '#eab308' : 
                              '#10b981';
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 md:py-3 transition-all duration-200 group
                    ${isActive ? '' : 'hover:bg-gray-900/50'}`}
                  style={isActive ? {
                    backgroundColor: `${tabColor}15`,
                    borderTop: `2px solid ${tabColor}`
                  } : {}}
                >
                  {/* Active background glow */}
                  {isActive && (
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `linear-gradient(to top, ${tabColor}40, transparent)`
                      }}
                    ></div>
                  )}
                  
                  {/* Icon */}
                  <div className="relative z-10">
                    <Image 
                      src={tab.icon} 
                      alt={tab.label}
                      width={32}
                      height={32}
                      className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 transition-all duration-200 ${
                        isActive ? 'brightness-110 drop-shadow-[0_0_8px_currentColor]' : ''
                      }`}
                      style={isActive ? {
                        filter: `drop-shadow(0 0 8px ${tabColor})`
                      } : {}}
                    />
                  </div>
                  
                  {/* Label */}
                  <span 
                    className={`text-micro sm:text-caption font-bold transition-all duration-200 relative z-10 ${
                      isActive ? '' : 'text-gray-300'
                    }`}
                    style={isActive ? {
                      color: tabColor,
                      textShadow: `0 0 8px ${tabColor}60`
                    } : {}}
                  >
                    {tab.label}
                  </span>
                  
                  {/* Active indicator bar at bottom */}
                  {isActive && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{
                        background: `linear-gradient(to right, transparent, ${tabColor}, transparent)`,
                        boxShadow: `0 0 8px ${tabColor}`
                      }}
                    ></div>
                  )}
                </button>
              );
            })}
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
              <GameButton
                color="red"
                fullWidth
                size="sm"
                onClick={quitGame}
              >
                Quit Game (Back to Home)
              </GameButton>
              <GameButton
                color="gold"
                fullWidth
                size="sm"
                onClick={closeSettings}
              >
                Close & Resume
              </GameButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
