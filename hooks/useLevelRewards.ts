'use client';

import { useMemo } from 'react';
import { useConfigStore } from '@/lib/store/configStore';
import type { LevelReward } from '@/lib/data/levelRewardsRepository';
import type { IndustryId } from '@/lib/game/types';

/**
 * Hook to get level rewards for the current industry from the pre-loaded config store
 * Returns all level rewards and the current level reward
 * Data is loaded once at game start and never refetched
 */
export function useLevelRewards(industryId: IndustryId, currentLevel?: number) {
  // Get level rewards from the pre-loaded config store
  const allLevelRewards = useConfigStore((state) => {
    const config = state.industryConfigs[industryId];
    return config?.levelRewards || [];
  });

  // Get current level reward from all level rewards (just filtering, no network call)
  const currentLevelReward = useMemo(() => {
    return allLevelRewards.find(reward => reward.level === currentLevel) || null;
  }, [allLevelRewards, currentLevel]);

  // Config is loaded synchronously at game start, so no loading state needed
  const isLoading = false;
  const error = null;

  /**
   * Get level reward for a specific level from the cached data
   */
  const getLevelReward = (level: number): LevelReward | null => {
    return allLevelRewards.find(reward => reward.level === level) || null;
  };

  /**
   * Get cumulative effects up to a specific level
   */
  const getCumulativeEffects = (targetLevel: number) => {
    // Filter rewards from level 0 up to target level (include all levels that have rewards)
    const applicableRewards = allLevelRewards
      .filter(reward => reward.level <= targetLevel)
      .sort((a, b) => a.level - b.level);

    if (applicableRewards.length === 0) {
      return [];
    }

    // Group effects by metric and type
    const effectMap = new Map<string, {
      metric: any;
      type: any;
      value: number;
      levels: number[];
    }>();

    applicableRewards.forEach(reward => {
      reward.effects.forEach(effect => {
        const key = `${effect.metric}_${effect.type}`;
        const existing = effectMap.get(key);

        if (existing) {
          // Aggregate based on effect type
          if (effect.type === 'add') {
            existing.value += effect.value;
          } else if (effect.type === 'percent') {
            existing.value += effect.value; // Sum percentages
          } else if (effect.type === 'multiply') {
            existing.value *= effect.value; // Multiply multipliers
          } else if (effect.type === 'set') {
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

    // Convert map to array
    return Array.from(effectMap.values()).map(({ metric, type, value }) => ({
      metric,
      type,
      value,
    }));
  };

  return {
    allLevelRewards,
    currentLevelReward,
    isLoading,
    error,
    getLevelReward,
    getCumulativeEffects,
  };
}