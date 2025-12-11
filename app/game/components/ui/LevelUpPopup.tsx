'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useGameStore } from '../../../../lib/store/gameStore';
import { EffectType, GameMetric } from '@/lib/game/effectManager';
import GameButton from '@/app/components/ui/GameButton';
import { useConfigStore } from '@/lib/store/configStore';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
import type { LevelReward } from '@/lib/data/levelRewardsRepository';
import { fetchLevelRewards } from '@/lib/server/actions/adminActions';

const formatCurrency = (value: number): string => `$${Math.abs(value).toLocaleString()}`;
const formatMagnitude = (value: number): string => {
  return Number.isInteger(value) ? Math.abs(value).toString() : Math.abs(value).toFixed(2);
};

const getEffectColorClass = (value: number) => {
  return value > 0 ? 'text-green-400' : 'text-red-400';
};

const LevelUpPopup: React.FC = () => {
  const levelUpReward = useGameStore((state) => state.levelUpReward);
  const clearLevelUpReward = useGameStore((state) => state.clearLevelUpReward);
  const metrics = useGameStore((state) => state.metrics);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const { getDisplayLabel, getMergedDefinition } = useMetricDisplayConfigs(industryId);

  const formatEffectValue = useCallback((effect: any): string => {
    const { metric, type, value } = effect;
    const sign = value >= 0 ? '+' : '-';
    const absValue = Math.abs(value);

    // Get unit from metric definition
    const metricDef = getMergedDefinition(metric);
    const unit = metricDef.display.unit || '';

    if (type === EffectType.Add) {
      switch (metric) {
        case GameMetric.Cash:
        case GameMetric.MonthlyExpenses:
        case GameMetric.ServiceRevenueFlatBonus:
          return `${sign}${formatCurrency(value)}`;
        case GameMetric.MyTime:
          return `${sign}${formatMagnitude(value)}h`;
        default:
          return `${sign}${formatMagnitude(value)}${unit}`;
      }
    }

    if (type === EffectType.Percent) {
      const percent = Math.round(absValue);
      return `${sign}${percent}%`;
    }

    if (type === EffectType.Multiply) {
      const multiplier = Number.isInteger(value) ? value.toString() : value.toFixed(2);
      return `×${multiplier}${unit}`;
    }

    if (type === EffectType.Set) {
      switch (metric) {
        case GameMetric.MonthlyExpenses:
        case GameMetric.ServiceRevenueFlatBonus:
          return formatCurrency(value);
        default:
          return formatMagnitude(value);
      }
    }

    return `${sign}${formatMagnitude(value)}${unit}`;
  }, [getMergedDefinition]);

  // Calculate cumulative effects up to a specific level
  const calculateCumulativeEffects = useCallback((targetLevel: number, allLevelRewards: any[]): any[] => {
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
      reward.effects.forEach((effect: any) => {
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
  }, []);

  // Get all level rewards for the industry (cached)
  const [allLevelRewards, setAllLevelRewards] = useState<any[]>([]);

  useEffect(() => {
    if (!levelUpReward || !levelUpReward.level) return;

    const fetchRewards = async () => {
      try {
        const rewards = await fetchLevelRewards(industryId);
        if (rewards) {
          // Filter rewards up to current level
          const relevantRewards = rewards.filter(reward => reward.level <= levelUpReward.level!);
          setAllLevelRewards(relevantRewards);
        }
      } catch (error) {
        console.error('Failed to fetch level rewards:', error);
      }
    };

    fetchRewards();
  }, [levelUpReward?.level, industryId]); // Only re-fetch when level changes

  // Calculate previous level effects (before level up)
  const previousLevel = levelUpReward ? levelUpReward.level - 1 : 1;
  const previousLevelEffects = useMemo(() => {
    return calculateCumulativeEffects(previousLevel, allLevelRewards);
  }, [calculateCumulativeEffects, previousLevel, allLevelRewards]);

  // Calculate current level effects (after level up)
  const currentLevelEffects = useMemo(() => {
    return calculateCumulativeEffects(levelUpReward?.level || 1, allLevelRewards);
  }, [calculateCumulativeEffects, levelUpReward?.level, allLevelRewards]);

  // Combine all unique effects from previous and current level for comparison
  const allEffectKeys = useMemo(() => {
    const keys = new Set<string>();
    previousLevelEffects.forEach(effect => {
      keys.add(`${effect.metric}_${effect.type}`);
    });
    currentLevelEffects.forEach(effect => {
      keys.add(`${effect.metric}_${effect.type}`);
    });
    return Array.from(keys);
  }, [previousLevelEffects, currentLevelEffects]);

  // Get effect value for a specific level
  const getEffectValue = useCallback((effects: any[], metric: GameMetric, type: EffectType): number | null => {
    const effect = effects.find(e => e.metric === metric && e.type === type);
    return effect ? effect.value : null;
  }, []);

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
        setCountdown((prev) => {
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

  if (!levelUpReward) return null;

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
            {levelUpReward.title && levelUpReward.title !== `Level ${levelUpReward.level}` && (
              <div className="text-xs text-[var(--game-primary)]/80 font-medium">
                {levelUpReward.title}
              </div>
            )}
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xs font-semibold text-tertiary px-1.5 py-0.5 bg-[var(--bg-tertiary)]/60 rounded text-center min-w-[60px]">
                Level {levelUpReward.level - 1}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--game-primary)]">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className="text-xs font-semibold text-[var(--game-primary)] px-1.5 py-0.5 bg-[var(--game-primary)]/25 rounded text-center min-w-[60px]">
                Level {levelUpReward.level}
              </span>
            </div>
          </div>

          {/* Effects Comparison */}
          <div className="mb-2">
            <div className="text-xs font-semibold text-[var(--text-primary)] mb-2 text-center opacity-90">
              Level Up Bonus:
            </div>
            {currentLevelEffects.length > 0 ? (
              <div className="space-y-1.5 p-2 bg-[var(--bg-secondary)]/40 rounded border border-[var(--border-primary)]/30">
                {currentLevelEffects.map((effect, index) => {
                  const label = getDisplayLabel(effect.metric);
                  const previousValue = getEffectValue(previousLevelEffects, effect.metric, effect.type);

                  return (
                    <div key={`${effect.metric}_${effect.type}`} className="flex items-center justify-between py-0.5">
                      <span className="text-xs text-secondary font-medium opacity-90">
                        {label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {/* Previous Value */}
                        <span className="text-xs text-tertiary opacity-75">
                          {previousValue !== null ? formatEffectValue({ metric: effect.metric, type: effect.type, value: previousValue }) : '0'}
                        </span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-tertiary opacity-60 flex-shrink-0">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        {/* Current Value (highlighted) */}
                        <span className="text-xs font-semibold text-[var(--game-primary)]">
                          {formatEffectValue(effect)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 px-2">
                <div className="text-lg mb-1">🏆</div>
                <div className="text-xs text-tertiary opacity-80">
                  Loading level bonuses...
                </div>
              </div>
            )}
          </div>

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