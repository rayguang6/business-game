'use client';

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useGameStore } from '../../../../lib/store/gameStore';
import { EffectType, GameMetric } from '@/lib/game/effectManager';
import GameButton from '@/app/components/ui/GameButton';
import { useConfigStore } from '@/lib/store/configStore';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
import type { LevelReward } from '@/lib/data/levelRewardsRepository';
import { fetchLevelRewards } from '@/lib/server/actions/adminActions';
import type { UpgradeEffect } from '@/lib/game/types';
import { LevelEffectsDisplay } from './LevelEffectsDisplay';


const LevelUpPopup: React.FC = () => {
  const levelUpReward = useGameStore((state) => state.levelUpReward);
  const clearLevelUpReward = useGameStore((state) => state.clearLevelUpReward);
  const metrics = useGameStore((state) => state.metrics);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const { getDisplayLabel, getMergedDefinition } = useMetricDisplayConfigs(industryId);

  // State for all level rewards to calculate cumulative effects
  const [allLevelRewards, setAllLevelRewards] = useState<LevelReward[]>([]);


  // Helper function to calculate cumulative effects up to a specific level
  const calculateCumulativeEffects = useCallback((targetLevel: number): UpgradeEffect[] => {
    // Filter rewards from level 2 up to target level (level 1 has no reward)
    const applicableRewards = allLevelRewards
      .filter(reward => reward.level >= 2 && reward.level <= targetLevel)
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

  // Fetch all level rewards when popup appears
  useEffect(() => {
    if (levelUpReward && industryId) {
      fetchLevelRewards(industryId)
        .then((rewards) => {
          setAllLevelRewards(rewards || []);
        })
        .catch((error) => {
          console.error('[LevelUpPopup] Failed to fetch level rewards:', error);
          setAllLevelRewards([]);
        });
    }
  }, [levelUpReward, industryId]);

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
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] pointer-events-auto" />
      <div className="relative z-10 w-full max-w-[75%] md:max-w-md pointer-events-auto">
        {/* Subtle frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-card)]/70 to-[var(--bg-secondary)]/70 backdrop-blur-sm rounded-lg border border-[var(--game-primary)]/30 shadow-lg" />

        <div className="relative bg-[var(--bg-card)]/85 backdrop-blur-sm rounded-lg shadow-lg p-3 md:p-4 border border-[var(--border-primary)]/40 max-h-[calc(100vh-6rem)] md:max-h-[60vh] overflow-y-auto">
          {/* Header */}
          <div className="mb-2 md:mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🎉</span>
              <h3 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                Congratulations!
              </h3>
            </div>
            <h4 className="text-xs md:text-sm font-semibold text-[var(--game-primary)] mb-1">
              You've Reached Level {levelUpReward.level}
            </h4>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs font-medium text-tertiary px-2 py-1 bg-[var(--bg-tertiary)]/60 rounded text-center">
                {previousTitle}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--game-primary)] flex-shrink-0">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className="text-xs font-semibold text-[var(--game-primary)] px-2 py-1 bg-[var(--game-primary)]/25 rounded text-center">
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

          <div className="mt-2">
            <GameButton
              color="blue"
              fullWidth
              size="sm"
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