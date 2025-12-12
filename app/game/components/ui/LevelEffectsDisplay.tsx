'use client';

import React, { useCallback, useMemo } from 'react';
import { EffectType, GameMetric, effectManager } from '@/lib/game/effectManager';
import type { UpgradeEffect, IndustryServiceDefinition } from '@/lib/game/types';
import { getServicesForIndustry } from '@/lib/features/services';
import { getAvailability } from '@/lib/game/requirementChecker';
import type { GameStore } from '@/lib/store/gameStore';
import { getBusinessStats } from '@/lib/game/config';
import { ServicePricingCategory } from '@/lib/game/types';

/**
 * Check if an effect should be displayed as a one-time bonus rather than a persistent effect
 */
function shouldDisplayAsOneTimeBonus(metric: GameMetric, type: EffectType): boolean {
  // One-time bonuses: Add effects on spendable resources
  if (type === EffectType.Add) {
    return [
      GameMetric.Cash,
      GameMetric.MyTime,
      GameMetric.LeveragedTime,
      GameMetric.Exp,
      GameMetric.GenerateLeads,
    ].includes(metric);
  }

  // All other effects (Percent, Multiply, Set) are persistent modifiers
  return false;
}

const formatCurrency = (value: number): string => `$${Math.abs(value).toLocaleString()}`;
const formatMagnitude = (value: number): string => {
  return Number.isInteger(value) ? Math.abs(value).toString() : Math.abs(value).toFixed(2);
};

const getEffectColorClass = (value: number) => {
  return value > 0 ? 'text-green-400' : 'text-red-400';
};

interface LevelEffectsDisplayProps {
  effects: UpgradeEffect[];
  previousLevelEffects?: UpgradeEffect[];
  currentLevelEffects?: UpgradeEffect[];
  nextLevelEffects?: UpgradeEffect[]; // For LevelCard (current vs next)
  getDisplayLabel: (metric: GameMetric) => string;
  getMergedDefinition: (metric: GameMetric) => any;
  showOneTimeBonuses?: boolean;
  showPersistentEffects?: boolean;
  hasNextLevel?: boolean; // For LevelCard layout
  oneTimeBonusesTitle?: string; // Custom title for one-time bonuses section
  className?: string;
  store?: GameStore; // Game store for requirement checking
  industryId?: string; // Industry ID for service checking
}

export function LevelEffectsDisplay({
  effects,
  previousLevelEffects = [],
  currentLevelEffects = [],
  nextLevelEffects = [],
  getDisplayLabel,
  getMergedDefinition,
  showOneTimeBonuses = true,
  showPersistentEffects = true,
  hasNextLevel = false,
  oneTimeBonusesTitle = '🎁 Level Rewards',
  className = '',
  store,
  industryId,
}: LevelEffectsDisplayProps) {

  // Get the highest price from unlocked services
  const getHighestUnlockedServicePrice = useCallback((): number => {
    if (!store || !industryId) return 500; // Default fallback

    const services = getServicesForIndustry(industryId as any);
    if (services.length === 0) return 500;

    // Filter services that are available (not hidden/locked)
    const availableServices = services.filter(service => {
      if (!service.requirements || service.requirements.length === 0) {
        return true; // No requirements means always available
      }
      const availability = getAvailability(service.requirements, store);
      return availability === 'available';
    });

    if (availableServices.length === 0) return 500;

    // Find the highest price among available services
    const highestPrice = Math.max(...availableServices.map(s => s.price));
    return highestPrice;
  }, [store, industryId]);

  // Calculate potential earnings for level rewards: $500 * (1 + revenueBonus/100)
  // This shows the total final price including the base 100%
  const calculateLevelRewardPotentialEarnings = useCallback((revenueBonusPercentage: number): number => {
    // Calculation: $500 * (1 + revenueBonus/100) = $500 * (100 + revenueBonus) / 100
    // revenueBonusPercentage is already a percentage (e.g., 10 means 10%)
    // So if bonus is 10%, result is $500 * 1.10 = $550 (total final price)
    const potentialEarnings = 500 * (1 + revenueBonusPercentage / 100);
    return Math.round(potentialEarnings * 100) / 100; // Round to 2 decimal places
  }, []);

  // Calculate potential earnings for persistent effects (uses complex calculation)
  const calculatePotentialEarnings = useCallback((revenueBonusPercentage: number): number => {
    const servicePrice = getHighestUnlockedServicePrice();

    // Get tier revenue multiplier for the highest tier (usually high tier gives highest multiplier)
    const tierRevenueMultiplier = effectManager.calculate(GameMetric.HighTierServiceRevenueMultiplier, 1);

    // Get service revenue scale from business stats
    const businessStats = getBusinessStats(industryId as any);
    const serviceRevenueScale = businessStats?.serviceRevenueScale ?? 10;

    // Calculate potential earnings using only the revenue bonus (not other multipliers)
    // Formula: servicePrice * tierMultiplier * (revenueBonus / 100) * serviceRevenueScale
    const potentialEarnings = servicePrice * tierRevenueMultiplier * (revenueBonusPercentage / 100) * serviceRevenueScale;

    return Math.round(potentialEarnings * 100) / 100; // Round to 2 decimal places
  }, [getHighestUnlockedServicePrice, industryId]);

  const formatEffectValue = useCallback((effect: UpgradeEffect, isLevelReward: boolean = false): string => {
    const { metric, type, value } = effect;
    const sign = value >= 0 ? '+' : '-';
    const absValue = Math.abs(value);

    // Get unit from metric definition
    const metricDef = getMergedDefinition(metric);
    const unit = metricDef.display.unit || '';

    if (type === EffectType.Add) {
      // Special handling for ServiceRevenueMultiplier with Add type - show potential earnings
      // When Add is used, the value is added to the base (e.g., base 100 + 100 = 200, which is +100% bonus)
      if (metric === GameMetric.ServiceRevenueMultiplier && isLevelReward) {
        // The value represents percentage points to add (e.g., 100 = +100 percentage points = +100% bonus)
        const potentialEarnings = calculateLevelRewardPotentialEarnings(absValue);
        return `$${potentialEarnings.toLocaleString()}`;
      }
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
      // Special handling for ServiceRevenueMultiplier - show potential earnings
      if (metric === GameMetric.ServiceRevenueMultiplier) {
        // For level rewards, use simple $500 * revenueBonus calculation
        // For persistent effects, use complex calculation
        const potentialEarnings = isLevelReward 
          ? calculateLevelRewardPotentialEarnings(absValue)
          : calculatePotentialEarnings(absValue);
        return `$${potentialEarnings.toLocaleString()}`;
      }
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
  }, [getMergedDefinition, calculateLevelRewardPotentialEarnings, calculatePotentialEarnings]);

  // Get effect value for a specific level
  const getEffectValueForLevel = useCallback((effects: UpgradeEffect[], metric: GameMetric, type: EffectType): number | null => {
    const effect = effects.find(e => e.metric === metric && e.type === type);
    return effect ? effect.value : null;
  }, []);

  // Separate one-time bonuses from persistent effects
  // For persistent effects comparison, include effects from both current and next levels
  const allPersistentEffects = hasNextLevel && nextLevelEffects
    ? [...effects, ...nextLevelEffects]
    : effects;

  // Remove duplicates by metric and type for persistent effects
  const uniquePersistentEffects = allPersistentEffects.filter((effect, index, self) =>
    index === self.findIndex(e => e.metric === effect.metric && e.type === effect.type)
  );

  // For one-time bonuses, only use current effects (not future levels)
  const oneTimeBonuses = effects.filter(effect =>
    shouldDisplayAsOneTimeBonus(effect.metric as GameMetric, effect.type as EffectType)
  );
  const persistentEffects = uniquePersistentEffects.filter(effect =>
    !shouldDisplayAsOneTimeBonus(effect.metric as GameMetric, effect.type as EffectType)
  );

  // Filter out unchanged persistent effects
  const filteredPersistentEffects = persistentEffects.filter(effect => {
    const metric = effect.metric as GameMetric;
    const type = effect.type as EffectType;

    // Determine which effects to compare based on context
    const beforeEffects = hasNextLevel ? currentLevelEffects : previousLevelEffects;
    const afterEffects = hasNextLevel ? nextLevelEffects : currentLevelEffects;

    // Get before and after values if available
    const beforeValue = getEffectValueForLevel(beforeEffects, metric, type);
    const afterValue = getEffectValueForLevel(afterEffects, metric, type);

    // Skip if effect is unchanged (before and after values are the same)
    return !(beforeValue !== null && afterValue !== null && beforeValue === afterValue);
  });

  const hasPersistentEffects = filteredPersistentEffects.length > 0 && showPersistentEffects;
  const hasOneTimeBonuses = oneTimeBonuses.length > 0 && showOneTimeBonuses;

  // For level cards, also show effects if there are next level effects to compare against
  const hasNextLevelEffects = hasNextLevel && nextLevelEffects && nextLevelEffects.length > 0;

  if (!hasPersistentEffects && !hasOneTimeBonuses && !hasNextLevelEffects) {
    return (
      <div className={`text-center py-4 px-2 ${className}`}>
        <div className="text-lg mb-1">🏆</div>
        <div className="text-sm text-white opacity-80">
          No level rewards configured
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Persistent Effects with Before/After */}
      {hasPersistentEffects && (
        <div className="p-3 bg-white/10 rounded border border-white/20">
          {/* <div className="text-sm font-semibold text-[var(--text-primary)] mb-2 text-center opacity-90">
            📈 Permanent Upgrades
          </div> */}
          <div className="space-y-2">
            {filteredPersistentEffects.map((effect, index) => {
              // For level rewards, show "Potential Earnings" for ServiceRevenueMultiplier (both Add and Percent types)
              const label = effect.metric === GameMetric.ServiceRevenueMultiplier &&
                (effect.type === EffectType.Percent || effect.type === EffectType.Add)
                ? 'Potential Earnings'
                : getDisplayLabel(effect.metric);
              const metric = effect.metric as GameMetric;
              const type = effect.type as EffectType;

              // Determine which effects to compare based on context
              const beforeEffects = hasNextLevel ? currentLevelEffects : previousLevelEffects;
              const afterEffects = hasNextLevel ? nextLevelEffects : currentLevelEffects;

              // Get before and after values if available
              const beforeValue = getEffectValueForLevel(beforeEffects, metric, type);
              const afterValue = getEffectValueForLevel(afterEffects, metric, type);

              return (
                <div key={`persistent-${effect.metric}_${effect.type}`} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-white font-medium opacity-90 flex-1">
                    {label}
                  </span>
                  <div className="flex items-center gap-2">
                    {afterValue !== null ? (
                      <>
                        <span className="text-sm text-white/70">
                          {beforeValue !== null
                            ? formatEffectValue({ metric, type, value: beforeValue } as UpgradeEffect, true)
                            : formatEffectValue({ metric, type, value: 0 } as UpgradeEffect, true)
                          }
                        </span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white flex-shrink-0">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        <span className={`text-sm font-semibold ${
                          // Show green text for improvements
                          (beforeValue !== null && (
                            // For costs (lower is better)
                            (metric === GameMetric.MonthlyExpenses || metric === GameMetric.FailureRate)
                              ? afterValue < beforeValue
                              // For benefits (higher is better)
                              : afterValue > beforeValue
                          ))
                            ? 'text-green-400 font-bold'
                            : 'text-white'
                        }`}>
                          {formatEffectValue({ metric, type, value: afterValue } as UpgradeEffect, true)}
                        </span>
                      </> 
                    ) : (
                      <span className="text-sm font-semibold text-white">
                        {formatEffectValue(effect, true)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* One-time Bonuses */}
      {hasOneTimeBonuses && (
        <div className="p-3 bg-white/10 rounded border border-white/20">
          <div className="text-sm font-semibold text-white mb-2 text-center">
            {oneTimeBonusesTitle}
          </div>
          <div className="space-y-1.5">
            {oneTimeBonuses.map((effect, index) => {
              // For level rewards, show "Potential Earnings" for ServiceRevenueMultiplier (both Add and Percent types)
              const label = effect.metric === GameMetric.ServiceRevenueMultiplier && 
                (effect.type === EffectType.Percent || effect.type === EffectType.Add)
                ? 'Potential Earnings'
                : getDisplayLabel(effect.metric);
              return (
                <div key={`bonus-${effect.metric}_${effect.type}`} className="flex items-center justify-between py-1">
                  <span className="text-sm text-white/80 font-medium opacity-90">
                    {label}
                  </span>
                  <span className="text-sm font-bold text-white">
                    +{formatEffectValue(effect, true).replace(/^\+/, '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}