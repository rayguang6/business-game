'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { useConfigStore } from '@/lib/store/configStore';
import { Card } from '@/app/components/ui/Card';
import { getLevel } from '@/lib/store/types';
import { getExpPerLevel, getBusinessStats, DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
import { fetchLevelReward } from '@/lib/server/actions/adminActions';
import type { LevelReward } from '@/lib/data/levelRewardsRepository';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { UpgradeEffect } from '@/lib/game/types';

const formatMagnitude = (value: number): string => {
  return Number.isInteger(value) ? Math.abs(value).toString() : Math.abs(value).toFixed(2);
};

const formatRawNumber = (value: number): string => {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

const formatCurrency = (value: number): string => `$${Math.abs(value).toLocaleString()}`;
const formatRawCurrency = (value: number): string => `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString()}`;

const getEffectIcon = (metric: GameMetric) => {
  switch (metric) {
    case GameMetric.Cash: return '💵';
    case GameMetric.MyTime: return '⏰';
    case GameMetric.ServiceSpeedMultiplier: return '⚡';
    case GameMetric.Exp: return '⭐';
    case GameMetric.ServiceRevenueMultiplier: return '💰';
    case GameMetric.ServiceRevenueFlatBonus: return '💵';
    case GameMetric.MonthlyExpenses: return '💸';
    case GameMetric.LeadsPerMonth: return '💡';
    case GameMetric.ServiceCapacity: return '👥';
    default: return '✨';
  }
};

export function LevelCard() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const metrics = useGameStore((state) => state.metrics);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const configStatus = useConfigStore((state) => state.configStatus);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const { getDisplayLabel } = useMetricDisplayConfigs(industryId);
  const [levelReward, setLevelReward] = useState<LevelReward | null>(null);
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

  // Fetch level reward when level changes - always fetch for any level
  useEffect(() => {
    console.log('[LevelCard] Fetching level reward for level:', currentLevel);
    setIsLoading(true);
    fetchLevelReward(industryId, currentLevel)
      .then((reward) => {
        console.log('[LevelCard] Fetched level reward:', { level: currentLevel, reward });
        setLevelReward(reward);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('[LevelCard] Failed to fetch level reward:', error);
        setLevelReward(null);
        setIsLoading(false);
      });
  }, [currentLevel, industryId]);

  const formatEffect = useCallback((effect: UpgradeEffect): string => {
    const { metric, type, value } = effect;
    const label = getDisplayLabel(metric);
    const sign = value >= 0 ? '+' : '-';
    const absValue = Math.abs(value);

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
          return `${sign}${formatMagnitude(value)} ${label}`;
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

    return `${sign}${formatMagnitude(value)} ${label}`;
  }, [getDisplayLabel]);

  // Format effect value for display
  const formatEffectValue = useCallback((effect: UpgradeEffect): string => {
    const { metric, type, value } = effect;
    const sign = value >= 0 ? '+' : '-';
    const absValue = Math.abs(value);

    if (type === EffectType.Add) {
      switch (metric) {
        case GameMetric.Cash:
        case GameMetric.MonthlyExpenses:
        case GameMetric.ServiceRevenueFlatBonus:
          return `${sign}${formatCurrency(value)}`;
        case GameMetric.MyTime:
          return `${sign}${formatMagnitude(value)}h`;
        default:
          return `${sign}${formatMagnitude(value)}`;
      }
    }

    if (type === EffectType.Percent) {
      const percent = Math.round(absValue);
      return `${sign}${percent}%`;
    }

    if (type === EffectType.Multiply) {
      const multiplier = Number.isInteger(value) ? value.toString() : value.toFixed(2);
      return `×${multiplier}`;
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

    return `${sign}${formatMagnitude(value)}`;
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

  // Show card even if no reward found, but with a message
  if (!levelReward) {
    return (
      <Card className="w-full" variant="info">
        <div className="p-4">
          <div className="text-base font-semibold" style={{ color: 'var(--game-primary)' }}>
            Level {currentLevel}
          </div>
          <div className="text-sm text-tertiary mt-2">
            No level reward configured for this level.
          </div>
        </div>
      </Card>
    );
  }

  // If reward exists but has no effects, still show the title
  if (levelReward.effects.length === 0) {
    return (
      <Card className="w-full" variant="info">
        <div className="p-4">
          <div className="text-base font-semibold" style={{ color: 'var(--game-primary)' }}>
            Level {currentLevel}: {levelReward.title || 'Level Reward'}
          </div>
          <div className="text-sm text-tertiary mt-2">
            No active effects.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full" variant="info">
      <div className="p-4">
        {/* Level and Title */}
        <div className="mb-3">
          <div className="text-base font-semibold" style={{ color: 'var(--game-primary)' }}>
            Level {currentLevel}: {levelReward.title || 'Level Reward'}
          </div>
        </div>
        
        {/* Level Reward Effects */}
        {levelReward.effects.length > 0 && (
          <div className="space-y-2">
            {levelReward.effects.map((effect, index) => {
              const label = getDisplayLabel(effect.metric);
              const valueDisplay = formatEffectValue(effect);
              
              // For Percent type, show value with percentage sign
              let displayValue = valueDisplay;
              if (effect.type === EffectType.Percent) {
                // Format: "Current% (+Change%)" or just "Change%"
                displayValue = valueDisplay;
              }
              
              return (
                <div key={index} className="flex items-center justify-between gap-4 py-1">
                  <span className="text-sm text-secondary flex-1">
                    {label}:
                  </span>
                  <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--success)' }}>
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
