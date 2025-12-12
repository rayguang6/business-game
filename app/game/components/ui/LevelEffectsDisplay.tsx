'use client';

import React, { useCallback } from 'react';
import { EffectType, GameMetric } from '@/lib/game/effectManager';
import type { UpgradeEffect } from '@/lib/game/types';

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
}: LevelEffectsDisplayProps) {
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
          return formatCurrency(value);
        default:
          return formatMagnitude(value);
      }
    }

    return `${sign}${formatMagnitude(value)}${unit}`;
  }, [getMergedDefinition]);

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

  const hasPersistentEffects = persistentEffects.length > 0 && showPersistentEffects;
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
            {persistentEffects.map((effect, index) => {
              const label = getDisplayLabel(effect.metric);
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
                            ? formatEffectValue({ metric, type, value: beforeValue } as UpgradeEffect)
                            : formatEffectValue({ metric, type, value: 0 } as UpgradeEffect)
                          }
                        </span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white flex-shrink-0">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        <span className={`text-sm font-semibold text-white`}>
                          {formatEffectValue({ metric, type, value: afterValue } as UpgradeEffect)}
                        </span>
                      </> 
                    ) : (
                      <span className="text-sm font-semibold text-white">
                        {formatEffectValue(effect)}
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
              const label = getDisplayLabel(effect.metric);
              return (
                <div key={`bonus-${effect.metric}_${effect.type}`} className="flex items-center justify-between py-1">
                  <span className="text-sm text-white/80 font-medium opacity-90">
                    {label}
                  </span>
                  <span className="text-sm font-bold text-white">
                    +{formatEffectValue(effect).replace(/^\+/, '')}
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