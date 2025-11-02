'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
import EventPopup from '@/app/game/components/ui/EventPopup';
import GameOverPopup from '@/app/game/components/ui/GameOverPopup';
import { FlagDebug } from '@/app/game/components/ui/FlagDebug';
import { useRandomEventTrigger } from '@/hooks/useRandomEventTrigger';
import Image from 'next/image';
import { fetchGlobalSimulationConfig } from '@/lib/data/simulationConfigRepository';
import { fetchMarketingCampaigns } from '@/lib/data/marketingRepository';
import { fetchFlagsForIndustry } from '@/lib/data/flagRepository';
import { fetchServicesForIndustry } from '@/lib/data/serviceRepository';
import { fetchUpgradesForIndustry } from '@/lib/data/upgradeRepository';
import { fetchEventsForIndustry } from '@/lib/data/eventRepository';
import { fetchStaffDataForIndustry } from '@/lib/data/staffRepository';
import { fetchConditionsForIndustry } from '@/lib/data/conditionRepository';
import {
  setIndustryServices,
  setIndustryUpgrades,
  setIndustryEvents,
  setGlobalSimulationConfigValues,
} from '@/lib/game/industryConfigs';
import {
  setStaffRolesForIndustry,
  setStaffNamePoolForIndustry,
  setInitialStaffForIndustry,
} from '@/lib/game/staffConfig';
import { IndustryId } from '@/lib/game/types';

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
  const setMarketingCampaigns = useGameStore((state) => state.setAvailableCampaigns);
  

  // Play game music when component mounts
  useAudio('game', true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [globalConfig, marketingCampaigns] = await Promise.all([
          fetchGlobalSimulationConfig(),
          fetchMarketingCampaigns(),
        ]);
        if (!isMounted) {
          return;
        }

        if (globalConfig) {
          setGlobalSimulationConfigValues(globalConfig);
        }

        if (marketingCampaigns && marketingCampaigns.length > 0) {
          setMarketingCampaigns(marketingCampaigns);
        }
      } catch (error) {
        console.error('Failed to load global simulation config', error);
      } finally {
        if (isMounted) {
          setGlobalConfigReady(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [setMarketingCampaigns]);

  useEffect(() => {
    let isMounted = true;

    if (!selectedIndustry || !globalConfigReady) {
      setDataLoadState('idle');
      return () => {
        isMounted = false;
      };
    }

    setDataLoadState('loading');

    (async () => {
      const industryId = selectedIndustry.id as IndustryId;
      try {
        const [servicesResult, upgradesResult, eventsResult, staffResult, conditionsResult, flagsResult] = await Promise.all([
          fetchServicesForIndustry(industryId),
          fetchUpgradesForIndustry(industryId),
          fetchEventsForIndustry(industryId),
          fetchStaffDataForIndustry(industryId),
          fetchConditionsForIndustry(industryId),
          fetchFlagsForIndustry(industryId),
        ]);

        if (!isMounted) {
          return;
        }

        const services = Array.isArray(servicesResult) ? servicesResult : [];
        const upgrades = Array.isArray(upgradesResult) ? upgradesResult : [];
        const events = Array.isArray(eventsResult) ? eventsResult : [];
        const staffData = staffResult ?? null;
        const conditions = Array.isArray(conditionsResult) ? conditionsResult : [];
        const flags = Array.isArray(flagsResult) ? flagsResult : [];

        const hasServices = services.length > 0;
        const hasUpgrades = upgrades.length > 0;
        const hasEvents = events.length > 0;
        const hasStaff =
          staffData === null ||
          (Array.isArray(staffData.roles) && staffData.roles.length > 0);
        const hasConditions = conditions.length > 0;
        const hasFlags = flags.length > 0;

        if (hasServices) {
          setIndustryServices(industryId, services);
        }

        if (hasUpgrades) {
          setIndustryUpgrades(industryId, upgrades);
        }

        if (hasEvents) {
          setIndustryEvents(industryId, events);
        }

        if (staffData && staffData.roles.length > 0) {
          setStaffRolesForIndustry(industryId, staffData.roles);
          setStaffNamePoolForIndustry(industryId, staffData.namePool);
          setInitialStaffForIndustry(industryId, staffData.initialStaff);
          initializeStaffForIndustry(industryId);
        } else if (!staffData) {
          initializeStaffForIndustry(industryId);
        }

        // Set conditions and flags regardless of whether they exist (empty array is fine)
        setAvailableConditions(conditions);
        setAvailableFlags(flags);

        if (hasServices && hasUpgrades && hasEvents && hasStaff) {
          setDataLoadState('ready');
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
        }
      } catch (err) {
        console.error('Failed to load industry data', err);
        if (isMounted) {
          setDataLoadState('error');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedIndustry, initializeStaffForIndustry, globalConfigReady]);

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

        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-30">
          {/* Fullscreen toggle anchored bottom-left to stay out of TopBar's way */}
          <FullscreenToggle targetId="game-shell" />
        </div>
        
        {/* Game Canvas - Full Area */}
        <div className="relative z-10 w-full h-full bg-gray-800 flex items-center justify-center">
          <GameCanvas />
          <EventPopup />
          <GameOverPopup />
          <FlagDebug />
        </div>
      </div>

      {/* Mobile: Bottom Section - Navigation & Tabs (flexible height) */}
      {/* Desktop: Right Section - Navigation & Tabs (50% width) */}
      <div className="relative z-20 bg-gray-900 border-t-2 md:border-t-0 md:border-l-2 border-gray-700 flex-1 md:h-full md:w-1/2 flex flex-col overflow-hidden">
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
                  <Image 
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
