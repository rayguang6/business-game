'use client';

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useGameStore } from '../../../../lib/store/gameStore';
import { EffectType, GameMetric } from '@/lib/game/effectManager';
import GameButton from '@/app/components/ui/GameButton';
import { useConfigStore } from '@/lib/store/configStore';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { getRankBackgroundColor, getRankTextColor } from '@/lib/store/types';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
import type { LevelReward } from '@/lib/data/levelRewardsRepository';
import type { UpgradeEffect } from '@/lib/game/types';
import { LevelEffectsDisplay } from './LevelEffectsDisplay';
import { useLevelRewards } from '@/hooks/useLevelRewards';


const LevelUpPopup: React.FC = () => {
  const levelUpReward = useGameStore((state) => state.levelUpReward);
  const clearLevelUpReward = useGameStore((state) => state.clearLevelUpReward);
  const metrics = useGameStore((state) => state.metrics);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const { getDisplayLabel, getMergedDefinition } = useMetricDisplayConfigs(industryId);

  // Get level rewards from pre-loaded config store
  const { allLevelRewards, isLoading: isLoadingRewards } = useLevelRewards(industryId);


  // Helper function to calculate cumulative effects up to a specific level
  const calculateCumulativeEffects = useCallback((targetLevel: number): UpgradeEffect[] => {
    // Filter rewards from level 0 up to target level
    const applicableRewards = allLevelRewards
      .filter(reward => reward.level <= targetLevel)
      .sort((a, b) => a.level - b.level);

    if (applicableRewards.length === 0) {
      return [];
    }

    // Group effects by metric and type
    const effectMap = new Map<string, {
      metric: GameMetric;
      type: EffectType;
      value: number;
      levels: number[];
    }>();

    applicableRewards.forEach(reward => {
      reward.effects.forEach(effect => {
        const key = `${effect.metric}_${effect.type}`;
        const existing = effectMap.get(key);

        if (existing) {
          // Aggregate based on effect type
          if (effect.type === EffectType.Add) {
            existing.value += effect.value;
          } else if (effect.type === EffectType.Percent) {
            existing.value += effect.value; // Sum percentages
          } else if (effect.type === EffectType.Multiply) {
            existing.value *= effect.value; // Multiply multipliers
          } else if (effect.type === EffectType.Set) {
            // Set: use the value from the highest level
            if (reward.level > Math.max(...existing.levels)) {
              existing.value = effect.value;
            }
          }
          existing.levels.push(reward.level);
        } else {
          effectMap.set(key, {
            metric: effect.metric,
            type: effect.type,
            value: effect.value,
            levels: [reward.level],
          });
        }
      });
    });

    // Convert map to array of UpgradeEffect
    return Array.from(effectMap.values()).map(({ metric, type, value }) => ({
      metric,
      type,
      value,
    }));
  }, [allLevelRewards]);

  // Get effects from the current level reward
  const levelRewardEffects = useMemo(() => {
    if (!levelUpReward?.effects) return [];
    return levelUpReward.effects;
  }, [levelUpReward?.effects]);

  // Level rewards are now loaded from pre-loaded config store

  // Get previous level reward for title progression
  const previousLevelReward = useMemo(() => {
    if (!levelUpReward || !levelUpReward.level) return null;
    const currentLevel = levelUpReward.level;
    return allLevelRewards.find(reward => reward.level === currentLevel - 1) || null;
  }, [allLevelRewards, levelUpReward]);

  // Determine titles for progression
  const previousTitle = levelUpReward && levelUpReward.level && previousLevelReward?.title
    ? `Level ${levelUpReward.level - 1}: ${previousLevelReward.title}`
    : levelUpReward?.level ? `Level ${levelUpReward.level - 1}` : '';
  const currentTitle = levelUpReward && levelUpReward.title
    ? `Level ${levelUpReward.level}: ${levelUpReward.title}`
    : levelUpReward?.level ? `Level ${levelUpReward.level}` : '';

  // Get all unique ranks in order (based on first appearance in level rewards)
  const allRanks = useMemo(() => {
    return Array.from(new Set(allLevelRewards.map(r => r.rank).filter(Boolean))).filter(Boolean) as string[];
  }, [allLevelRewards]);

  // Get ranks for previous and current levels
  const previousRank = isLoadingRewards ? 'Rank' : (previousLevelReward?.rank || 'Unknown Rank');
  const currentRank = isLoadingRewards ? 'Rank' : (levelUpReward?.rank || 'Unknown Rank');

  // Calculate cumulative effects for previous level (before level up)
  const previousLevelEffects = useMemo(() => {
    if (!levelUpReward?.level) return [];
    return calculateCumulativeEffects(levelUpReward.level - 1);
  }, [calculateCumulativeEffects, levelUpReward?.level]);

  // Calculate cumulative effects for current level (after level up)
  const currentLevelEffects = useMemo(() => {
    if (!levelUpReward?.level) return [];
    return calculateCumulativeEffects(levelUpReward.level);
  }, [calculateCumulativeEffects, levelUpReward?.level]);


  // Get reactive UI config from store
  const globalConfig = useConfigStore((state) => state.globalConfig);
  const uiConfig = useMemo(() => ({
    outcomePopupDurationSeconds: globalConfig?.uiConfig?.outcomePopupDurationSeconds ?? 5,
  }), [globalConfig?.uiConfig]);

  const [countdown, setCountdown] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-dismiss level up popup after configured duration
  useEffect(() => {
    // Clear any existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Auto-dismiss level up popup
    if (levelUpReward) {
      const outcomeDuration = uiConfig.outcomePopupDurationSeconds;
      setCountdown(outcomeDuration);
      timeoutRef.current = setTimeout(() => {
        clearLevelUpReward();
        setCountdown(null);
      }, outcomeDuration * 1000);

      intervalRef.current = setInterval(() => {
        setCountdown((prev: number | null) => {
          if (prev === null) return prev;
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1_000);
    } else {
      setCountdown(null);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [levelUpReward, clearLevelUpReward]);

  if (!levelUpReward || !levelUpReward.level) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-2 md:px-6 pt-16 md:pt-6 pb-2 md:pb-6 pointer-events-none">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] pointer-events-auto" />
      <div className="relative z-10 w-full max-w-[90%] sm:max-w-[85%] md:max-w-md pointer-events-auto">
        {/* Subtle frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-blue-50/70 to-indigo-100/60 backdrop-blur-sm rounded-lg border-2 border-blue-300/50 shadow-xl" />

        <div className="relative bg-gradient-to-br from-blue-500 via-blue-400 to-indigo-500 rounded-lg shadow-xl p-4 md:p-4 border border-blue-300/60 max-h-[calc(100vh-6rem)] md:max-h-[60vh] overflow-y-auto">
          {/* Header */}
          <div className="mb-3 md:mb-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl">🎉</span>
              <h3 className="text-base md:text-sm font-bold text-white leading-tight">
                Congratulations!
              </h3>
            </div>
            <div className="mb-2">
              <span className="text-sm md:text-sm font-semibold text-white">
                You've Reached{' '}
              </span>
              <span className="text-2xl md:text-xl font-bold text-white">
                Level {levelUpReward.level}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2 py-1 rounded-md ${getRankBackgroundColor(previousRank, allRanks)} ${getRankTextColor(previousRank, allRanks)}`}>
                {previousRank}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white flex-shrink-0">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className={`text-xs font-semibold px-2 py-1 rounded-md ${getRankBackgroundColor(currentRank, allRanks)} ${getRankTextColor(currentRank, allRanks)}`}>
                {currentRank}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mb-3">
              <span className="text-sm font-bold text-white/80 text-center min-w-0 truncate max-w-[200px]">
                {previousTitle}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white flex-shrink-0 rotate-90 sm:rotate-0">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-bold text-green-300 border-2 border-green-400 bg-green-500/10 px-3 py-1 rounded-lg text-center min-w-0 truncate max-w-[250px]">
                {currentTitle}
              </span>
            </div>
          </div>

          {/* Level Rewards */}
          <LevelEffectsDisplay
            effects={levelRewardEffects}
            previousLevelEffects={previousLevelEffects}
            currentLevelEffects={currentLevelEffects}
            getDisplayLabel={getDisplayLabel}
            getMergedDefinition={getMergedDefinition}
          />

          {/* Unlocked Flags - Commented out for now */}
          {/* {levelUpReward.unlocksFlags && levelUpReward.unlocksFlags.length > 0 && (
            <div className="bg-[var(--bg-tertiary)]/60 rounded p-1.5 md:p-3 mb-1 md:mb-2 border border-[var(--border-secondary)]">
              <div className="text-[10px] md:text-sm font-semibold text-[var(--text-primary)] mb-0.5 md:mb-1">Unlocked Features:</div>
              <ul className="space-y-0.5 text-[9px] md:text-sm">
                {levelUpReward.unlocksFlags.map((flagId, index) => (
                  <li key={index} className="text-[var(--text-primary)]">
                    🔓 {flagId}
                  </li>
                ))}
              </ul>
            </div>
          )} */}

          <div className="mt-4">
            <GameButton
              color="gold"
              fullWidth
              size="md"
              onClick={() => {
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
                setCountdown(null);
                clearLevelUpReward();
              }}
            >
              Continue{countdown !== null && countdown > 0 ? ` (${countdown}s)` : ''}
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelUpPopup;