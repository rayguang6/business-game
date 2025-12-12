'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CampaignEffect, MarketingCampaign } from '@/lib/store/slices/marketingSlice';
import { GameMetric, EffectType, effectManager } from '@/lib/game/effectManager';
import { useRequirements } from '@/lib/hooks/useRequirements';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { Card } from '@/app/components/ui/Card';
import { Modal } from '@/app/components/ui/Modal';
import GameButton from '@/app/components/ui/GameButton';
import { DEFAULT_INDUSTRY_ID, getBusinessStats } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
import { getMetricIcon, getMetricEmojiIcon } from '@/lib/game/metrics/registry';

const formatSeconds = (seconds: number): string => {
  return `${Math.max(0, Math.floor(seconds))}s`;
};

const formatValue = (value: number): string => {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/0+$/u, '').replace(/\.$/u, '');
};

const formatSigned = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatValue(value)}`;
};

const formatDurationLabel = (durationMonths: number | null | undefined): string => {
  if (durationMonths === null || durationMonths === undefined || !Number.isFinite(durationMonths) || durationMonths <= 0) {
    return '';
  }
  return ` for ${durationMonths} month`;
};

const getToneClass = (effect: CampaignEffect): string => {
  switch (effect.type) {
    case EffectType.Add:
    case EffectType.Percent:
      return effect.value >= 0 ? 'text-green-300' : 'text-red-300';
    case EffectType.Multiply:
      if (effect.value > 1) return 'text-green-300';
      if (effect.value < 1) return 'text-red-300';
      return 'text-gray-300';
    case EffectType.Set:
    default:
      return 'text-gray-300';
  }
};

interface MarketingCampaignCardProps {
  campaign: MarketingCampaign;
  canAfford: boolean;
  isOnCooldown: boolean;
  cooldownRemaining: number;
  currentLevel?: number; // For leveled campaigns
  wasActivatedThisMonth: boolean;
  isLaunching?: boolean; // Prevent multiple rapid clicks
  onLaunch: (campaignId: string) => void;
  metrics: { cash: number; time: number };
  getDisplayLabel: (metric: GameMetric) => string;
}

export function MarketingCampaignCard({
  campaign,
  canAfford,
  isOnCooldown,
  cooldownRemaining,
  currentLevel,
  wasActivatedThisMonth,
  isLaunching,
  onLaunch,
  metrics,
  getDisplayLabel
}: MarketingCampaignCardProps & { isLaunching?: boolean; metrics: { cash: number; time: number }; getDisplayLabel: (metric: GameMetric) => string }) {
  const { availability, descriptions: requirementDescriptions } = useRequirements(campaign.requirements);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);

  // Handle leveled vs unlimited campaigns
  const isLeveled = campaign.type === 'leveled';
  const level = currentLevel || 0;
  const maxLevel = campaign.maxLevel || (campaign.levels?.length || 0);
  const canUpgradeMore = isLeveled && level < maxLevel;

  // Get cost and effects based on campaign type
  let needsCash = false;
  let needsTime = false;
  let cost = 0;
  let timeCost: number | undefined;
  let effects: CampaignEffect[] = [];
  let levelConfig: any = null;

  if (isLeveled && canUpgradeMore) {
    // Get next level config
    const nextLevelNumber = level + 1;
    levelConfig = campaign.levels?.find(l => l.level === nextLevelNumber) || campaign.levels?.[nextLevelNumber - 1];
    if (levelConfig) {
      needsCash = levelConfig.cost > 0;
      needsTime = levelConfig.timeCost !== undefined && levelConfig.timeCost > 0;
      cost = levelConfig.cost;
      timeCost = levelConfig.timeCost;
      // Show effects for the next level only
      effects = levelConfig.effects;
    }
  } else if (!isLeveled) {
    // Unlimited campaign
    needsCash = (campaign.cost ?? 0) > 0;
    needsTime = campaign.timeCost !== undefined && campaign.timeCost > 0;
    cost = campaign.cost ?? 0;
    timeCost = campaign.timeCost;
    effects = campaign.effects || [];
  }

  // Determine what's missing for button text
  const needText = useMemo(() => {
    const hasCash = !needsCash || metrics.cash >= cost;
    const hasTime = !needsTime || metrics.time >= (timeCost ?? 0);
    return (!hasCash || !hasTime) ? 'Need Resources' : '';
  }, [needsCash, needsTime, metrics.cash, metrics.time, cost, timeCost]);

  const describeEffect = (effect: CampaignEffect): string => {
    // If custom description exists, use it instead of technical details
    if (effect.description) {
      const durationLabel = formatDurationLabel(effect.durationMonths);
      return `${effect.description}${durationLabel}`;
    }

    const label = getDisplayLabel(effect.metric);

    // GenerateLeads is an immediate action - duration doesn't apply
    if (effect.metric === GameMetric.GenerateLeads) {
      const count = Math.floor(effect.value);
      return `${label} +${count}`;
    }

    const durationLabel = formatDurationLabel(effect.durationMonths);

    switch (effect.type) {
      case EffectType.Add:
        return `${label} ${formatSigned(effect.value)}${durationLabel}`;
      case EffectType.Percent:
        return `${label} ${formatSigned(effect.value)}%${durationLabel}`;
      case EffectType.Multiply:
        return `${label} ×${formatValue(effect.value)}${durationLabel}`;
      case EffectType.Set:
        return `${label} = ${formatValue(effect.value)}${durationLabel}`;
      default:
        return `${label} ${effect.type} ${formatValue(effect.value)}${durationLabel}`;
    }
  };

  const descriptions = effects.map((effect, index) => ({
    text: describeEffect(effect),
    toneClass: getToneClass(effect),
    metric: effect.metric,
    effectIndex: index,
  }));

  const buttonDisabled = isOnCooldown || !canAfford || availability === 'locked' || isLaunching;

  const handleRequirementsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRequirementsModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowRequirementsModal(false);
  }, []);

  const isMaxLevel = isLeveled && !canUpgradeMore && level > 0;

  // Hide card if requirements are not met and should be hidden
  if (availability === 'hidden') {
    return null;
  }

  return (
    <Card className={`relative flex flex-col justify-between overflow-hidden ${
      isMaxLevel
        ? '!bg-amber-100 dark:!bg-amber-900/50 !border-amber-300 dark:!border-amber-600'
        : wasActivatedThisMonth
          ? '!border-green-500 dark:!border-green-400'
          : ''
    }`}>
      {/* Level Badge - Absolute positioned */}
      {isLeveled && (
        <div className={`absolute top-1 right-1 sm:top-1.5 sm:right-1.5 md:top-2 md:right-2 px-1.5 py-0.5 rounded border text-body-sm sm:text-label font-bold z-10 bg-black/10 ${
          level > 0
            ? 'text-green-300 border-green-400'
            : 'text-gray-300 border-gray-500'
        }`}>
          {level}/{maxLevel}
        </div>
      )}

      {/* Top Content Section */}
      <div className="space-y-0.5">
        {/* Header: Campaign Name */}
        <div className="flex items-center">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="text-caption font-bold sm:text-body-sm text-primary break-words whitespace-normal leading-tight">
              {campaign.name}
            </span>
          </div>
        </div>

        {/* What You'll Get (Next Level Info) */}
        {isLeveled && canUpgradeMore && (
          <>
            {levelConfig?.name && (
              <div>
                <p className="text-caption font-semibold text-primary leading-tight break-words whitespace-normal">
                  {levelConfig.name}
                </p>
              </div>
            )}

            <div className="">
              <ul className="space-y-0.5">
                {descriptions.map((item, index) => {
                  const iconPath = getMetricIcon(item.metric);
                  return (
                    <li key={`${campaign.id}-effect-${index}`} className="flex items-center gap-1 text-caption sm:text-body-sm text-secondary leading-tight">
                      {iconPath ? (
                        <img
                          src={iconPath}
                          alt=""
                          className="w-4 h-4 mt-0.5 flex-shrink-0"
                        />
                      ) : (
                        <span className="text-primary mt-0.5 flex-shrink-0">{getMetricEmojiIcon(item.metric)}</span>
                      )}
                      <span className={`flex-1 ${item.toneClass} break-words whitespace-normal`}>{item.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

        {/* For unlimited campaigns or when no upgrade available */}
        {(!isLeveled || !canUpgradeMore) && (
          <>
            <div className="">
              <ul className="space-y-0.5">
                {descriptions.map((item, index) => {
                  const iconPath = getMetricIcon(item.metric);
                  return (
                    <li key={`${campaign.id}-effect-${index}`} className="flex items-center gap-1 text-caption sm:text-body-sm text-secondary leading-tight">
                      {iconPath ? (
                        <img
                          src={iconPath}
                          alt=""
                          className="w-4 h-4 mt-0.5 flex-shrink-0"
                        />
                      ) : (
                        <span className="text-primary mt-0.5 flex-shrink-0">{getMetricEmojiIcon(item.metric)}</span>
                      )}
                      <span className={`flex-1 ${item.toneClass} break-words whitespace-normal`}>{item.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

      </div>

      {/* Separator */}
      <div className="text-center py-1">
        <div className="h-px bg-border opacity-30"></div>
      </div>

      {/* Bottom Section: Button and Cost */}
      <div className="space-y-1">

        {/* Action Button */}
        <div className="relative">
          <GameButton
            onClick={() => onLaunch(campaign.id)}
            disabled={buttonDisabled}
            color={isMaxLevel ? 'gold' : buttonDisabled ? 'gray' : 'green'}
            size="sm"
            fullWidth
            className="text-caption sm:text-body-sm py-1 sm:py-2 px-2 sm:px-4"
          >
            {isLaunching
              ? 'Launching...'
              : isOnCooldown
                ? `Cooldown: ${formatSeconds(cooldownRemaining)}`
                : availability === 'locked'
                  ? 'Not Met'
                  : isLeveled && !canUpgradeMore
                    ? 'Max Level'
                    : canAfford
                      ? (!isLeveled ? 'Get Leads' : 'Upgrade')
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

        {/* Cost Section - Compact */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {needsCash && (
            <div className={`flex items-center gap-0.5 ${
              metrics.cash >= cost
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {getMetricIcon(GameMetric.Cash) ? (
                <img
                  src={getMetricIcon(GameMetric.Cash)!}
                  alt="Cash"
                  className="w-4 h-4"
                />
              ) : (
                <span className="text-body-sm">💵</span>
              )}
              <span className="text-caption font-bold sm:text-body-sm">
                ${cost.toLocaleString()}
              </span>
            </div>
          )}
          {needsTime && (
            <div className={`flex items-center gap-0.5 ${
              metrics.time >= (timeCost ?? 0)
                ? 'text-cyan-600 dark:text-cyan-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {getMetricIcon(GameMetric.MyTime) ? (
                <img
                  src={getMetricIcon(GameMetric.MyTime)!}
                  alt="Time"
                  className="w-4 h-4"
                />
              ) : (
                <span className="text-body-sm">⏱️</span>
              )}
              <span className="text-caption font-bold sm:text-body-sm">
                {timeCost}h
              </span>
            </div>
          )}
          {!needsCash && !needsTime && !isMaxLevel && (
            <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
              <span className="text-body-sm">🆓</span>
              <span className="text-caption font-bold sm:text-body-sm">Free</span>
            </div>
          )}
        </div>
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
    </Card>
  );
}