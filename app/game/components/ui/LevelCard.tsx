'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { useConfigStore } from '@/lib/store/configStore';
import { Card } from '@/app/components/ui/Card';
import { getLevel, getRankBackgroundColor, getRankTextColor } from '@/lib/store/types';
import { getExpPerLevel, getBusinessStats, DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
import type { LevelReward } from '@/lib/data/levelRewardsRepository';
import { useLevelRewards } from '@/hooks/useLevelRewards';
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

  // Calculate current level BEFORE using it in hooks
  const currentLevel = useMemo(() => {
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
    return getLevel(metrics.exp, expPerLevel);
  }, [metrics.exp, configStatus, industryId]);

  // Now call hooks with calculated values
  const { getDisplayLabel, getMergedDefinition } = useMetricDisplayConfigs(industryId);
  const {
    allLevelRewards,
    currentLevelReward,
    isLoading,
    getCumulativeEffects
  } = useLevelRewards(industryId, currentLevel);

  // Debug logging
  useEffect(() => {
    console.log('[LevelCard] Render:', {
      exp: metrics.exp,
      currentLevel,
      industryId,
      configStatus,
      isLoading,
    });
  }, [metrics.exp, currentLevel, industryId, configStatus, isLoading]);


  // Use getCumulativeEffects from the hook
  const calculateCumulativeEffects = useCallback((targetLevel: number): UpgradeEffect[] => {
    return getCumulativeEffects(targetLevel);
  }, [getCumulativeEffects]);

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

  // Get all unique ranks in order (based on first appearance in level rewards)
  const allRanks = useMemo(() => {
    return Array.from(new Set(allLevelRewards.map(r => r.rank).filter(Boolean))).filter(Boolean) as string[];
  }, [allLevelRewards]);

  // Get ranks for current and next levels
  const currentRank = currentLevelReward?.rank || 'Unknown Rank';
  const nextRank = nextLevelReward?.rank || 'Unknown Rank';



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


  // Determine titles
  const currentTitle = currentLevelReward?.title
    ? `Level ${currentLevel}: ${currentLevelReward.title}`
    : `Level ${currentLevel}`;
  const nextTitle = nextLevelReward?.title
    ? `Level ${nextLevel}: ${nextLevelReward.title}`
    : `Level ${nextLevel}`;

  return (
    <Card className="w-full overflow-hidden" variant="info">
      <div className="p-5">
        {/* Header with Current and Next Level Titles */}
        <div className="mb-4 p-3 rounded-lg">
          {hasNextLevel ? (
            /* Compact layout when next level exists */
            <div className="flex flex-col items-center gap-3">
              {/* Rank Pills */}
              <div className="flex items-center justify-center gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${getRankBackgroundColor(currentRank, allRanks)} ${getRankTextColor(currentRank, allRanks)}`}>
                  {currentRank}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-tertiary flex-shrink-0">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${getRankBackgroundColor(nextRank, allRanks)} ${getRankTextColor(nextRank, allRanks)}`}>
                  {nextRank}
                </span>
              </div>

              {/* Level Titles */}
              <div className="flex items-center justify-center gap-3">
                {/* Current Level Badge */}
                <div className="text-sm font-bold text-green-300 border-2 border-green-400 bg-green-500/10 px-3 py-1 rounded-lg">
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
            </div>
          ) : (
            /* Centered single level when at max level */
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${getRankBackgroundColor(currentRank, allRanks)} ${getRankTextColor(currentRank, allRanks)}`}>
                  {currentRank}
                </span>
              </div>
              <div className="text-sm font-bold text-green-300 border-2 border-green-400 bg-green-500/10 px-3 py-1 rounded-lg">
                {currentTitle}
              </div>
            </div>
          )}
        </div>

        {/* Effects Comparison */}
        <LevelEffectsDisplay
          effects={nextLevelReward?.effects || []}
          currentLevelEffects={currentLevelEffects}
          nextLevelEffects={nextLevelEffects}
          getDisplayLabel={getDisplayLabel}
          getMergedDefinition={getMergedDefinition}
          showOneTimeBonuses={true}
          hasNextLevel={hasNextLevel}
          oneTimeBonusesTitle="🎁 Next Level Rewards"
          className="p-3 rounded-lg"
        />
      </div>
    </Card>
  );
}
