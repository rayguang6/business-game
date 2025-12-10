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

const formatMagnitude = (value: number): string => {
  return Number.isInteger(value) ? Math.abs(value).toString() : Math.abs(value).toFixed(2);
};

const formatRawNumber = (value: number): string => {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

const formatCurrency = (value: number): string => `$${Math.abs(value).toLocaleString()}`;
const formatRawCurrency = (value: number): string => `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString()}`;

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

  const formatEffect = useCallback((effect: UpgradeEffect): string => {
    const { metric, type, value } = effect;
    const label = getDisplayLabel(metric);
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
          return `${sign}${formatCurrency(value)} ${label}`;
        case GameMetric.MyTime:
          return `${sign}${formatMagnitude(value)}h ${label}`;
        case GameMetric.LeadsPerMonth:
          return `${sign}${formatMagnitude(value)} ${label}`;
        case GameMetric.ServiceCapacity:
          return `${sign}${formatMagnitude(value)} ${label}`;
        default:
          return `${sign}${formatMagnitude(value)}${unit} ${label}`;
      }
    }

    if (type === EffectType.Percent) {
      const percent = Math.round(absValue);
      switch (metric) {
        case GameMetric.LeadsPerMonth:
          return `${sign}${percent}% ${label}`;
        default:
          return `${sign}${percent}% ${label}`;
      }
    }

    if (type === EffectType.Multiply) {
      const multiplier = Number.isInteger(value) ? value.toString() : value.toFixed(2);
      return `×${multiplier} ${label}`;
    }

    if (type === EffectType.Set) {
      switch (metric) {
        case GameMetric.MonthlyExpenses:
        case GameMetric.ServiceRevenueFlatBonus:
          return `Set ${label} to ${formatRawCurrency(value)}`;
        case GameMetric.LeadsPerMonth:
          return `Set ${label} to ${formatRawNumber(value)}`;
        default:
          return `Set ${label} to ${formatRawNumber(value)}`;
      }
    }

    return `${sign}${formatMagnitude(value)}${unit} ${label}`;
  }, [getDisplayLabel, getMergedDefinition]);

  // Format effect value for display
  const formatEffectValue = useCallback((effect: UpgradeEffect): string => {
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
          return formatRawCurrency(value);
        default:
          return formatRawNumber(value);
      }
    }

    return `${sign}${formatMagnitude(value)}${unit}`;
  }, [getMergedDefinition]);

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


  // Combine all unique effects from current and next level for comparison
  const allEffectKeys = useMemo(() => {
    const keys = new Set<string>();
    currentLevelEffects.forEach(effect => {
      keys.add(`${effect.metric}_${effect.type}`);
    });
    if (hasNextLevel) {
      nextLevelEffects.forEach(effect => {
        keys.add(`${effect.metric}_${effect.type}`);
      });
    }
    return Array.from(keys);
  }, [currentLevelEffects, nextLevelEffects, hasNextLevel]);

  // Get effect value for a specific level
  const getEffectValue = useCallback((effects: UpgradeEffect[], metric: GameMetric, type: EffectType): number | null => {
    const effect = effects.find(e => e.metric === metric && e.type === type);
    return effect ? effect.value : null;
  }, []);

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
        {allEffectKeys.length > 0 ? (
          <div className="space-y-3 p-3 bg-secondary/5 rounded-lg border border-secondary/10">
            {allEffectKeys.map((key) => {
              const [metricStr, typeStr] = key.split('_');
              const metric = metricStr as GameMetric;
              const type = typeStr as EffectType;

              const currentValue = getEffectValue(currentLevelEffects, metric, type);
              const nextValue = getEffectValue(nextLevelEffects, metric, type);
              const label = getDisplayLabel(metric);

              // Only show if there's a current or next value
              if (currentValue === null && nextValue === null) {
                return null;
              }

              return (
                <div key={key} className="grid grid-cols-12 items-center">
                  {/* Metric Label Box */}
                  <div className="col-span-5">
                    <span className="text-sm text-secondary font-medium">
                      {label}
                    </span>
                  </div>

                  {/* Values Box - centered within remaining space */}
                  <div className="col-span-7 flex items-center justify-center gap-2">
                    {/* Current Level Value */}
                    <span className="text-sm font-semibold text-primary">
                      {currentValue !== null ? formatEffectValue({ metric, type, value: currentValue } as UpgradeEffect) : '0'}
                    </span>

                    {/* Arrow and Next Value (only if next level exists) */}
                    {hasNextLevel && (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-tertiary flex-shrink-0">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        <span
                          className={`text-sm font-semibold ${
                            nextValue !== null && nextValue !== currentValue ? 'text-green-500' : 'text-primary'
                          }`}
                        >
                          {nextValue !== null ? formatEffectValue({ metric, type, value: nextValue } as UpgradeEffect) : '0'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 px-4">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-sm text-tertiary">
              {hasNextLevel
                ? 'No level rewards configured yet.'
                : 'Maximum level reached! All bonuses unlocked.'}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
