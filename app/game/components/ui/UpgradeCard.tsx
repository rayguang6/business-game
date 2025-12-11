'use client';

import React, { useMemo, useState, useCallback } from 'react';
import GameButton from '@/app/components/ui/GameButton';
import { useGameStore } from '@/lib/store/gameStore';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { UpgradeEffect, UpgradeDefinition } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { getMetricIcon } from '@/lib/game/metrics/registry';
import { useRequirements } from '@/lib/hooks/useRequirements';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { Card } from '@/app/components/ui/Card';
import { Modal } from '@/app/components/ui/Modal';

const formatMagnitude = (value: number): string => {
  return Number.isInteger(value) ? Math.abs(value).toString() : Math.abs(value).toFixed(2);
};

const formatRawNumber = (value: number): string => {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

const formatCurrency = (value: number): string => `$${Math.abs(value).toLocaleString()}`;
const formatRawCurrency = (value: number): string => `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString()}`;

interface UpgradeCardProps {
  upgrade: UpgradeDefinition;
}

export function UpgradeCard({ upgrade }: UpgradeCardProps) {
  const { getUpgradeLevel, purchaseUpgrade } = useGameStore();
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const { getDisplayLabel } = useMetricDisplayConfigs(industryId);
  // Subscribe to upgrades state to ensure re-renders when levels change
  const upgrades = useGameStore((state) => state.upgrades);
  // Subscribe to metrics with selector to ensure re-renders when metrics change
  const metrics = useGameStore((state) => state.metrics);
  // Subscribe to upgradesActivatedThisMonth to track monthly activation
  const upgradesActivatedThisMonth = useGameStore((state) => state.upgradesActivatedThisMonth);
  const { availability, descriptions: requirementDescriptions } = useRequirements(upgrade.requirements);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);

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

  // Calculate current level from subscribed upgrades state
  // currentLevel is 1-indexed: 0 = not purchased, 1 = level 1 purchased, 2 = level 2 purchased, etc.
  const currentLevel = useMemo(() => upgrades[upgrade.id] || 0, [upgrades, upgrade.id]);

  // Get current level config (for display)
  const currentLevelConfig = currentLevel > 0 && currentLevel <= upgrade.levels.length
    ? upgrade.levels.find(l => l.level === currentLevel) || upgrade.levels[currentLevel - 1]
    : null;

  // Get next level config (for purchase)
  const nextLevelNumber = currentLevel + 1;
  const nextLevelConfig = currentLevel < upgrade.maxLevel
    ? (upgrade.levels.find(level => level.level === nextLevelNumber) || upgrade.levels[currentLevel])
    : null;

  // Get cost, timeCost, and effects from level config
  const upgradeCost = nextLevelConfig ? nextLevelConfig.cost : 0;
  const upgradeTimeCost = nextLevelConfig?.timeCost;

  const needsCash = upgradeCost > 0;
  const needsTime = upgradeTimeCost !== undefined && upgradeTimeCost > 0;
  // Calculate affordability directly using subscribed metrics to ensure reactivity
  // Upgrades now only use personal time (myTime), not leveraged time
  const canAfford = useMemo(() => {
    const hasCash = upgradeCost === 0 || metrics.cash >= upgradeCost;
    const hasTime = upgradeTimeCost === undefined || upgradeTimeCost === 0 || metrics.myTime >= upgradeTimeCost;
    return hasCash && hasTime;
  }, [metrics.cash, metrics.myTime, upgradeCost, upgradeTimeCost]);
  const isMaxed = currentLevel >= upgrade.maxLevel;
  const wasActivatedThisMonth = useMemo(() => upgradesActivatedThisMonth.has(upgrade.id), [upgradesActivatedThisMonth, upgrade.id]);

  // Determine what's missing for button text
  const needText = useMemo(() => {
    const hasCash = !needsCash || metrics.cash >= upgradeCost;
    const hasTime = !needsTime || metrics.myTime >= upgradeTimeCost!;
    return (!hasCash || !hasTime) ? 'Need Resources' : '';
  }, [needsCash, needsTime, metrics.cash, metrics.myTime, upgradeCost, upgradeTimeCost]);

  // Get next level effects for display
  const nextLevelEffects = useMemo(() => {
    if (!nextLevelConfig) return [];
    return nextLevelConfig.effects.map(effect => formatEffect(effect));
  }, [nextLevelConfig, formatEffect]);

  const buttonDisabled = isMaxed || !canAfford || availability === 'locked';

  const handlePurchase = useCallback(() => {
    if (!buttonDisabled) {
      purchaseUpgrade(upgrade.id);
    }
  }, [buttonDisabled, purchaseUpgrade, upgrade.id]);

  const handleRequirementsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRequirementsModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowRequirementsModal(false);
  }, []);

  // Hide card if requirements are not met and should be hidden
  if (availability === 'hidden') {
    return null;
  }

  return (
    <Card className={`relative flex flex-col justify-between p-3 sm:p-5 md:p-7 min-h-[160px] sm:min-h-[220px] md:min-h-[240px] overflow-hidden ${
      wasActivatedThisMonth
        ? '!border-green-500 dark:!border-green-400'
        : isMaxed
          ? '!bg-amber-100 dark:!bg-amber-900/50 !border-amber-300 dark:!border-amber-600'
          : ''
    }`}>
      {/* Level Badge - Absolute positioned */}
      <div className={`absolute top-1 right-1 sm:top-2 sm:right-2 md:top-3 md:right-3 px-1.5 py-0.5 rounded border text-body-sm sm:text-label font-bold z-10 bg-black/40 backdrop-blur-sm ${
        currentLevel > 0
          ? 'text-green-300 border-green-400'
          : 'text-gray-300 border-gray-500'
      }`}>
        {currentLevel}/{upgrade.maxLevel}
      </div>

      {/* Top Content Section */}
      <div className="flex-1 space-y-0.5 sm:space-y-1">
        {/* Header: Upgrade Name */}
        <div className="flex items-center">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="text-body font-bold sm:text-heading-sm text-primary break-words whitespace-normal leading-tight">
              {upgrade.name}
            </span>
          </div>
        </div>

        {/* What You'll Get (Next Level Info) */}
        {nextLevelConfig && !isMaxed && (
          <>
            <div>
              <p className="text-body font-semibold text-primary leading-tight break-words whitespace-normal">
                {nextLevelConfig.name}
              </p>
            </div>

            {nextLevelEffects.length > 0 && (
              <div className="space-y-0.5">
                <ul className="space-y-0.5">
                  {nextLevelEffects.map((effect, idx) => {
                    const effectData = nextLevelConfig?.effects[idx];
                    const icon = effectData ? getMetricIcon(effectData.metric) : '•';
                    return (
                      <li key={idx} className="flex items-start gap-1 text-body-sm text-secondary leading-tight">
                        <span className="text-primary mt-0.5 flex-shrink-0">{icon}</span>
                        <span className="flex-1 break-words whitespace-normal">{effect}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Max Level Message */}
        {isMaxed && (
          <div className="p-0.5 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded">
            <p className="text-body-sm text-[var(--success)] font-semibold text-center break-words whitespace-normal">
              🎉 Max Level
            </p>
          </div>
        )}
      </div>

      {/* Bottom Section: Cost and Button */}
      {nextLevelConfig && !isMaxed && (
        <div className="space-y-0.5 sm:space-y-1 mt-1.5 sm:mt-3">
          {/* Cost Section - Compact */}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {needsCash && (
              <div className={`flex items-center gap-0.5 ${
                metrics.cash >= upgradeCost
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <span className="text-body-sm">{getMetricIcon(GameMetric.Cash)}</span>
                <span className="text-body-sm font-bold">
                  ${upgradeCost.toLocaleString()}
                </span>
              </div>
            )}
            {needsTime && (
              <div className={`flex items-center gap-0.5 ${
                metrics.myTime >= upgradeTimeCost!
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <span className="text-body-sm">⏱️</span>
                <span className="text-body-sm font-bold">
                  {upgradeTimeCost}h
                </span>
              </div>
            )}
            {!needsCash && !needsTime && (
              <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                <span className="text-body-sm">🆓</span>
                <span className="text-body-sm font-bold">Free</span>
              </div>
            )}
          </div>

      {/* Requirements Modal */}
      <Modal
        isOpen={showRequirementsModal}
        onClose={handleCloseModal}
        maxWidth="sm"
      >
        <div className="text-center text-secondary text-body-sm leading-relaxed space-y-1">
          <h3 className="text-primary font-semibold mb-3">Requirements</h3>
          {requirementDescriptions.map((desc, idx) => (
            <div key={idx}>{desc}</div>
          ))}
        </div>
      </Modal>

          {/* Action Button */}
          <div className="relative">
            <GameButton
              color={isMaxed ? 'gold' : canAfford && availability === 'available' ? 'blue' : 'gold'}
              fullWidth
              size="sm"
              disabled={buttonDisabled}
              onClick={handlePurchase}
              className="text-body-sm sm:text-sm py-1 sm:py-2 px-2 sm:px-4"
            >
              {isMaxed
                ? 'Max Level'
                : availability === 'locked'
                  ? 'Requirements Not Met'
                  : canAfford
                    ? `Upgrade`
                    : needText}
            </GameButton>
            {requirementDescriptions.length > 0 && availability === 'locked' && (
              <button
                onClick={handleRequirementsClick}
                className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-[var(--bg-tertiary)] hover:bg-[var(--game-primary)] text-white rounded-full text-micro font-bold shadow-md transition-colors flex items-center justify-center z-10"
                title="Click to see requirements"
              >
                ?
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}