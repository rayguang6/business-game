'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { useConfigStore } from '@/lib/store/configStore';
import { Card } from '@/app/components/ui/Card';
import { getLevel } from '@/lib/store/types';
import { getExpPerLevel, getBusinessStats, DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
import { fetchLevelReward, fetchLevelRewards } from '@/lib/server/actions/adminActions';
import type { LevelReward } from '@/lib/data/levelRewardsRepository';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { getMetricIcon } from '@/lib/game/metrics/registry';
import type { UpgradeEffect } from '@/lib/game/types';
import { LevelEffectsDisplay } from './LevelEffectsDisplay';

// Use centralized metric icons from registry
// const getEffectIcon = (metric: GameMetric) => getMetricIcon(metric);

export function LevelCard() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const metrics = useGameStore((state) => state.metrics);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const configStatus = useConfigStore((state) => state.configStatus);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const { getDisplayLabel, getMergedDefinition } = useMetricDisplayConfigs(industryId);
  const [levelReward, setLevelReward] = useState<LevelReward | null>(null);
  const [allLevelRewards, setAllLevelRewards] = useState<LevelReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Safely get exp per level - handle case when config isn't loaded yet
  const expPerLevel = useMemo(() => {
    let expPerLevel: number | number[] = 200; // Default fallback
    try {
      if (configStatus === 'ready') {
        const businessStats = getBusinessStats(industryId);
        if (businessStats) {
          expPerLevel = getExpPerLevel(industryId);
        }
      }
    } catch (error) {
      // If config access fails, use default
      console.warn('[LevelCard] Error accessing expPerLevel config, using default', error);
    }
    return expPerLevel;
  }, [configStatus, industryId]);
  
  const currentLevel = getLevel(metrics.exp, expPerLevel);

  // Debug logging
  useEffect(() => {
    console.log('[LevelCard] Render:', {
      exp: metrics.exp,
      expPerLevel,
      currentLevel,
      industryId,
      configStatus,
    });
  }, [metrics.exp, expPerLevel, currentLevel, industryId, configStatus]);

  // Fetch all level rewards and current level reward when level or industry changes
  useEffect(() => {
    console.log('[LevelCard] Fetching level rewards for level:', currentLevel);
    setIsLoading(true);
    
    // Fetch all level rewards for the industry
    Promise.all([
      fetchLevelRewards(industryId),
      fetchLevelReward(industryId, currentLevel)
    ])
      .then(([allRewards, currentReward]) => {
        console.log('[LevelCard] Fetched level rewards:', { 
          allRewards: allRewards?.length || 0, 
          currentLevel, 
          currentReward 
        });
        setAllLevelRewards(allRewards || []);
        setLevelReward(currentReward);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('[LevelCard] Failed to fetch level rewards:', error);
        setAllLevelRewards([]);
        setLevelReward(null);
        setIsLoading(false);
      });
  }, [currentLevel, industryId]);


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

  // Calculate cumulative effects for current level
  const currentLevelEffects = useMemo(() => {
    return calculateCumulativeEffects(currentLevel);
  }, [calculateCumulativeEffects, currentLevel]);

  // Calculate cumulative effects for next level
  const nextLevel = currentLevel + 1;
  const nextLevelEffects = useMemo(() => {
    return calculateCumulativeEffects(nextLevel);
  }, [calculateCumulativeEffects, nextLevel]);

  // Get next level reward info
  const nextLevelReward = useMemo(() => {
    return allLevelRewards.find(reward => reward.level === nextLevel) || null;
  }, [allLevelRewards, nextLevel]);

  // Check if there's a next level to show
  const hasNextLevel = useMemo(() => {
    return nextLevelReward !== null || nextLevelEffects.length > 0;
  }, [nextLevelReward, nextLevelEffects]);



  // If config not ready, show loading
  if (configStatus !== 'ready') {
    return (
      <Card className="w-full" variant="info">
        <div className="p-4">
          <div className="text-sm text-tertiary">Loading configuration...</div>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full" variant="info">
        <div className="p-4">
          <div className="text-center text-tertiary text-sm">Loading level rewards...</div>
        </div>
      </Card>
    );
  }

  // Determine titles
  const currentTitle = levelReward?.title 
    ? `Level ${currentLevel}: ${levelReward.title}` 
    : `Level ${currentLevel}`;
  const nextTitle = nextLevelReward?.title 
    ? `Level ${nextLevel}: ${nextLevelReward.title}` 
    : `Level ${nextLevel}`;

  return (
    <Card className="w-full overflow-hidden" variant="info">
      <div className="p-5">
        {/* Header with Current and Next Level Titles */}
        <div className="mb-4 p-3 bg-primary/5 rounded-olg">
          {hasNextLevel ? (
            /* Compact layout when next level exists */
            <div className="flex items-center justify-center gap-3">
              {/* Current Level Badge */}
              <div className="text-sm font-semibold text-primary">
                {currentTitle}
              </div>

              {/* Arrow */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-tertiary flex-shrink-0">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>

              {/* Next Level Badge */}
              <div className="text-sm font-semibold text-primary">
                {nextTitle}
              </div>
            </div>
          ) : (
            /* Centered single level when at max level */
            <div className="text-center">
              <div className="text-sm font-semibold text-primary">
                {currentTitle}
              </div>
            </div>
          )}
        </div>

        {/* Effects Comparison */}
        <LevelEffectsDisplay
          effects={currentLevelEffects}
          currentLevelEffects={currentLevelEffects}
          nextLevelEffects={nextLevelEffects}
          getDisplayLabel={getDisplayLabel}
          getMergedDefinition={getMergedDefinition}
          showOneTimeBonuses={false}
          hasNextLevel={hasNextLevel}
          className="p-3 bg-secondary/5 rounded-lg border border-secondary/10"
        />
      </div>
    </Card>
  );
}
