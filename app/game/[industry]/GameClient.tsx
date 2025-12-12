'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useAudio } from '@/hooks/useAudio';
import { TopBar } from '@/app/game/components/ui/TopBar';
import { GameCanvas } from '@/app/game/components/canvas/GameCanvas';
import { KeyMetrics } from '@/app/game/components/ui/KeyMetrics';
import { HomeTab } from '@/app/game/components/tabs/HomeTab';
import { UpgradesTab } from '@/app/game/components/tabs/UpgradesTab';
import { MarketingTab } from '@/app/game/components/tabs/MarketingTab';
import { TabType, TAB_CONFIGS } from '@/lib/types/ui';
import { useAudioControls } from '@/hooks/useAudio';
import { FullscreenToggle } from '@/app/game/components/ui/FullscreenToggle';
import EventPopup from '@/app/game/components/ui/EventPopup';
import LevelUpPopup from '@/app/game/components/ui/LevelUpPopup';
import { FlagDebug } from '@/app/game/components/ui/FlagDebug';
import { TierMultiplierDebug } from '@/app/game/components/ui/TierMultiplierDebug';
import { ExpenseValidatorDebug } from '@/app/game/components/ui/ExpenseValidatorDebug';
import { useRandomEventTrigger } from '@/hooks/useRandomEventTrigger';
import Image from 'next/image';
import { IndustryId, DEFAULT_INDUSTRY_ID } from '@/lib/game/types';
import { getLevel, getRankBackgroundColor, getRankTextColor } from '@/lib/store/types';
import { getLevelRewardsFromStore } from '@/lib/store/configStore';
import { getExpPerLevel } from '@/lib/game/config';
import GameButton from '@/app/components/ui/GameButton';
import { useConfigStore } from '@/lib/store/configStore';
import { ConfigErrorPage } from '@/app/game/components/ui/ConfigErrorPage';
import { ErrorBoundary } from '@/app/game/components/ui/ErrorBoundary';
import { GameQueryProvider } from '@/app/game/providers/QueryProvider';
import type { GlobalSimulationConfigState } from '@/lib/store/config/types';
import type { IndustryContentLoadResult } from '@/lib/server/loadGameData';
import type { Industry } from '@/lib/features/industries';

interface GameClientProps {
  industry: Industry;
  globalConfig: GlobalSimulationConfigState;
  industryContent: IndustryContentLoadResult;
}

export default function GameClient({ industry, globalConfig, industryContent }: GameClientProps) {
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const setSelectedIndustry = useGameStore((state) => state.setSelectedIndustry);
  const isGameStarted = useGameStore((state) => state.isGameStarted);
  const startGame = useGameStore((state) => state.startGame);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const unpauseGame = useGameStore((state) => state.unpauseGame);
  const resetAllGame = useGameStore((state) => state.resetAllGame);
  const setAvailableConditions = useGameStore((state) => state.setAvailableConditions);
  const setAvailableFlags = useGameStore((state) => state.setAvailableFlags);
  const metrics = useGameStore((state) => state.metrics);
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = React.useState<TabType>('home');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const { audioState, setVolume, toggleMute } = useAudioControls();
  const initializeStaffForIndustry = useGameStore((state) => state.initializeStaffForIndustry);
  const setGlobalConfigState = useConfigStore((state) => state.setGlobalConfig);
  const setIndustryConfigState = useConfigStore((state) => state.setIndustryConfig);
  const setConfigStatus = useConfigStore((state) => state.setConfigStatus);

  // Rank calculation logic
  const configStatus = useConfigStore((state) => state.configStatus);
  const [rankChangeKey, setRankChangeKey] = React.useState(0);
  const previousRankRef = React.useRef('Unknown Rank');

  const industryId = selectedIndustry ? (selectedIndustry.id ?? DEFAULT_INDUSTRY_ID) as IndustryId : null;
  const expPerLevel = industryId ? getExpPerLevel(industryId) : 200;
  const currentLevel = getLevel(metrics.exp, expPerLevel);
  const levelRewards = industryId ? getLevelRewardsFromStore(industryId) : [];
  const currentLevelReward = levelRewards.find(
    reward => reward.level === currentLevel
  );
  const currentRank = configStatus === 'ready' && currentLevelReward?.rank ? currentLevelReward.rank : 'Rank';

  const allRanks = Array.from(
    new Set(levelRewards.map(r => r.rank).filter(Boolean))
  ) as string[];

  React.useEffect(() => {
    if (previousRankRef.current !== currentRank) {
      previousRankRef.current = currentRank;
      setRankChangeKey(prev => prev + 1);
    }
  }, [currentRank]);

  // Play game music when component mounts
  // useAudio('game', true); // Commented out to disable background music

  // Initialize stores with server-loaded data
  useEffect(() => {
    // Set industry in store if not already set
    if (!selectedIndustry || selectedIndustry.id !== industry.id) {
      setSelectedIndustry(industry);
    }

    // Set global config
    setGlobalConfigState(globalConfig);
    setConfigStatus('ready');

    // Set industry config
    const industryId = industry.id as IndustryId;
    setIndustryConfigState(industryId, industryContent);

    // Initialize staff
    initializeStaffForIndustry(industryId);

    // Set conditions and flags
    setAvailableConditions(industryContent.conditions);
    setAvailableFlags(industryContent.flags);
  }, [
    industry,
    globalConfig,
    industryContent,
    selectedIndustry,
    setSelectedIndustry,
    setGlobalConfigState,
    setIndustryConfigState,
    setConfigStatus,
    initializeStaffForIndustry,
    setAvailableConditions,
    setAvailableFlags,
  ]);

  // Auto-start the game when data is ready
  useEffect(() => {
    if (!isGameStarted && selectedIndustry?.id === industry.id) {
      startGame();
    }
  }, [isGameStarted, selectedIndustry, industry.id, startGame]);

  // Initialize game loop
  useGameLoop();

  // Trigger random events for the active game
  useRandomEventTrigger();


  const closeSettings = () => {
    setSettingsOpen(false);
    unpauseGame();
  };

  const quitGame = () => {
    resetAllGame();
    setSettingsOpen(false);
    router.push('/');
  };

  if (!audioState) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GameQueryProvider>
        <div id="game-shell" className="game-root relative flex flex-col sm:flex-row">
          {/* Global Popups - Above everything */}
          <EventPopup />
          <LevelUpPopup />
        {/* Mobile: Top Section - Game Canvas Area (35% height) */}
        {/* Desktop: Left Section - Game Canvas Area (45% width) */}
        <div className="relative h-[35vh] sm:h-full sm:w-[45%] flex items-center justify-center py-4 sm:py-0 overflow-hidden bg-[#8ed0fb]">
          {/* Unified Top HUD Container */}
          <div className="absolute top-0 left-0 z-20 pt-2 sm:pt-3 md:pt-4 px-2 sm:px-3 md:px-4">
            <div className="flex flex-col items-start gap-2">
              {/* Top Section: Industry Info */}
              <div className="flex-shrink-0 w-[200px]">
                <TopBar />
              </div>

              {/* Bottom Section: KeyMetrics HUD */}
              <div className="flex-shrink-0 w-[200px]">
                <KeyMetrics />
              </div>
            </div>
          </div>

          {/* Rank Display - Moved to bottom right corner of game canvas */}
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-15">
            <span
              key={rankChangeKey}
              className={`font-semibold text-body-sm sm:text-body md:text-heading-sm flex-shrink-0 px-2 py-0.5 rounded-md transition-all duration-300 ease-out transform ${getRankBackgroundColor(currentRank, allRanks)} ${getRankTextColor(currentRank, allRanks)}`}
              style={{
                animation: rankChangeKey > 0 ? 'rankPulse 0.3s ease-out' : undefined,
              }}
            >
              {currentRank}
            </span>
          </div>

          {/* Fullscreen Button - Bottom left corner of game canvas */}
          {/* <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-30">
            <FullscreenToggle targetId="game-shell" />
          </div> */}
          
          {/* Game Canvas - Full Area */}
          <div className="relative z-10 w-full h-full bg-[#8ed0fb] flex items-center justify-center">
            <GameCanvas />
            {process.env.NODE_ENV === 'development' && (
              <>
                <FlagDebug />
                <TierMultiplierDebug />
                <ExpenseValidatorDebug />
              </>
            )}
          </div>
        </div>

        {/* Mobile: Bottom Section - Navigation & Tabs (flexible height) */}
        {/* Desktop: Right Section - Navigation & Tabs (50% width) */}
        <div
          className="relative z-20 border-t-2 sm:border-t-0 sm:border-l-2 flex-1 sm:h-full sm:w-1/2 flex flex-col overflow-hidden"
          style={{
            background: 'radial-gradient(circle at center, #2D1A69 0%, #1A0F3B 80%)',
            borderColor: 'rgba(58, 39, 138, 0.3)'
          }}
        >
          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 pb-20 sm:pb-6">
            {activeTab === 'home' && <HomeTab />}
            {activeTab === 'upgrades' && <UpgradesTab />}
            {activeTab === 'marketing' && <MarketingTab />}
          </div>

          {/* Bottom Navigation */}
          <div
            className="fixed sm:sticky bottom-0 left-0 right-0 z-30 flex-shrink-0"
            style={{
              background: '#4A1A8C',
              borderTop: '1px solid rgba(173, 216, 230, 0.3)'
            }}
          >
            <div className="flex h-full">
              {TAB_CONFIGS.map((tab) => {
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className="relative flex-1 flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 md:py-3 transition-all duration-200"
                  >
                    {isActive && (
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(135deg, #6B2FA0 0%, #5A1F8C 100%)',
                        }}
                      ></div>
                    )}
                    
                    <div className="relative z-10">
                      <Image
                        src={tab.icon}
                        alt={tab.label}
                        width={32}
                        height={32}
                        className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 transition-all duration-200"
                      />
                    </div>
                    
                    <span 
                      className="text-micro sm:text-caption font-bold transition-all duration-200 relative z-10 text-white uppercase"
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {settingsOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl w-80 p-5 max-h-[90vh] overflow-y-auto mx-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Settings</h2>
              <p className="text-sm text-gray-600 mb-4">Game is paused while settings are open.</p>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Audio Settings</h3>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Music</span>
                  <button
                    onClick={toggleMute}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      audioState.isMuted 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {audioState.isMuted ? '🔇 Muted' : '🔊 On'}
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Volume:</span>
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
                  <span className="text-sm text-gray-500 w-8">
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
      </GameQueryProvider>
    </ErrorBoundary>
  );
}



