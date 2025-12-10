'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CampaignEffect, MarketingCampaign } from '@/lib/store/slices/marketingSlice';
import { GameMetric, EffectType, effectManager } from '@/lib/game/effectManager';
import { useRequirements } from '@/lib/hooks/useRequirements';
import { useConfigStore } from '@/lib/store/configStore';
import { DEFAULT_INDUSTRY_ID, getBusinessStats } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
import { Card } from '@/app/components/ui/Card';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { Modal } from '@/app/components/ui/Modal';
import GameButton from '@/app/components/ui/GameButton';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { useCategories } from '../../hooks/useCategories';

const formatSeconds = (seconds: number): string => {
  return `${Math.max(0, Math.floor(seconds))}s`;
};

// METRIC_LABELS removed - now using merged definitions from registry + database

const formatValue = (value: number): string => {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/0+$/u, '').replace(/\.$/u, '');
};

const formatSigned = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatValue(value)}`;
};

// Simple hook to get active marketing campaigns with countdown timers
const useActiveMarketingCampaigns = () => {
  const gameTime = useGameStore(state => state.gameTime);
  const industryId = (useGameStore(state => state.selectedIndustry?.id) ?? DEFAULT_INDUSTRY_ID) as IndustryId;

  return useMemo(() => {
    const marketingEffects = effectManager.getEffectsByCategory('marketing');
    const stats = getBusinessStats(industryId);
    const monthDurationSeconds = stats?.monthDurationSeconds ?? 60;

    // Group effects by campaign
    const campaignEffects = new Map<string, any>();

    marketingEffects.forEach(effect => {
      // Skip permanent effects (durationMonths is null or 0)
      if (!effect.durationMonths || effect.durationMonths <= 0) {
        return;
      }

      const campaignId = effect.source.id;
      if (!campaignEffects.has(campaignId)) {
        campaignEffects.set(campaignId, {
          campaignId,
          campaignName: effect.source.name,
          effects: [],
          earliestExpiration: Infinity,
        });
      }

      const totalDuration = effect.durationMonths * monthDurationSeconds;
      const elapsed = gameTime - effect.createdAt;
      const timeRemaining = Math.max(0, totalDuration - elapsed);

      const campaign = campaignEffects.get(campaignId)!;
      campaign.effects.push({
        ...effect,
        timeRemaining,
        formattedTimeRemaining: formatSeconds(timeRemaining),
        isExpiringSoon: timeRemaining <= monthDurationSeconds * 0.25,
      });

      campaign.earliestExpiration = Math.min(campaign.earliestExpiration, timeRemaining);
    });

    // Convert to array and sort by earliest expiration
    return Array.from(campaignEffects.values())
      .sort((a, b) => a.earliestExpiration - b.earliestExpiration);
  }, [gameTime, industryId]);
};

const formatDurationLabel = (durationMonths: number | null | undefined): string => {
  if (durationMonths === null || durationMonths === undefined || !Number.isFinite(durationMonths)) {
    return ' (Permanent)';
  }
  if (durationMonths <= 0) {
    return ' (Instant)';
  }
  return ` for ${durationMonths} month${durationMonths === 1 ? '' : 's'}`;
};

// describeEffect moved inside component to use hook

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

interface CampaignCardProps {
  campaign: MarketingCampaign;
  canAfford: boolean;
  isOnCooldown: boolean;
  cooldownRemaining: number;
  currentLevel?: number; // For leveled campaigns
  wasActivatedThisMonth: boolean;
  onLaunch: (campaignId: string) => void;
  metrics: { cash: number; time: number };
  getDisplayLabel: (metric: GameMetric) => string;
}

function CampaignCard({ campaign, canAfford, isOnCooldown, cooldownRemaining, currentLevel, wasActivatedThisMonth, onLaunch, metrics, getDisplayLabel }: CampaignCardProps & { metrics: { cash: number; time: number }; getDisplayLabel: (metric: GameMetric) => string }) {
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
  
  if (isLeveled && canUpgradeMore) {
    // Get next level config
    const nextLevelNumber = level + 1;
    const levelConfig = campaign.levels?.find(l => l.level === nextLevelNumber) || campaign.levels?.[nextLevelNumber - 1];
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
      return `${label} +${count} (immediate)`;
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

  const descriptions = effects.map((effect) => ({
    text: describeEffect(effect),
    toneClass: getToneClass(effect),
  }));

  const buttonDisabled = isOnCooldown || !canAfford || availability === 'locked';

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
    <Card className={`flex flex-col justify-between p-2 sm:p-3 min-h-[200px] overflow-hidden ${
      isMaxLevel
        ? '!bg-amber-100 dark:!bg-amber-900/50 !border-amber-300 dark:!border-amber-600'
        : wasActivatedThisMonth
          ? '!border-green-500 dark:!border-green-400'
          : ''
    }`}>
      {/* Top Content Section */}
      <div className="flex-1 space-y-1">
        {/* Header: Campaign Name and Level Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-ultra-sm font-bold text-primary break-words whitespace-normal">
              {campaign.name}
            </span>
          </div>
          {isLeveled && (
            <div className="flex flex-col items-end gap-0.5">
              <div className={`px-1.5 py-0.5 rounded border text-micro font-bold ${
                level > 0
                  ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                  : 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                }`}>
                {level}/{maxLevel}
              </div>
              {/* {level === 0 && (
                <div className="text-micro text-amber-600 dark:text-amber-400 font-medium">
                  Effects may be active
                </div>
              )} */}
            </div>
          )}
        </div>

        {/* What You'll Get (Next Level Info) */}
        {isLeveled && canUpgradeMore && (
          <>
            <div>
              <p className="text-ultra-sm font-semibold text-primary leading-tight break-words whitespace-normal">
                Level {level + 1}
              </p>
            </div>

            <div className="space-y-0.5">
              <ul className="space-y-0.5">
                {descriptions.map((item, index) => (
                  <li key={`${campaign.id}-effect-${index}`} className="flex items-start gap-1 text-micro text-secondary leading-tight">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span className={`flex-1 ${item.toneClass} break-words whitespace-normal`}>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* For unlimited campaigns or when no upgrade available */}
        {(!isLeveled || !canUpgradeMore) && (
          <>
            <div className="space-y-0.5">
              <ul className="space-y-0.5">
                {descriptions.map((item, index) => (
                  <li key={`${campaign.id}-effect-${index}`} className="flex items-start gap-1 text-micro text-secondary leading-tight">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span className={`flex-1 ${item.toneClass} break-words whitespace-normal`}>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

      </div>

      {/* Bottom Section: Cost and Button */}
      <div className="space-y-1 mt-2">

        {/* Cost Section - 2 rows */}
        <div className="space-y-0.5">
          {needsCash && (
            <div className={`flex items-center gap-1 ${
              metrics.cash >= cost
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              <span className="text-sm">💵</span>
              <span className="text-ultra-sm font-bold">
                ${cost.toLocaleString()}
              </span>
            </div>
          )}
          {needsTime && (
            <div className={`flex items-center gap-1 ${
              metrics.time >= (timeCost ?? 0)
                ? 'text-cyan-600 dark:text-cyan-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              <span className="text-sm">⏱️</span>
              <span className="text-ultra-sm font-bold">
                {timeCost}h
              </span>
            </div>
          )}
          {!needsCash && !needsTime && !isMaxLevel && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <span className="text-sm">🆓</span>
              <span className="text-ultra-sm font-bold">Free</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="relative">
          <GameButton
            onClick={() => onLaunch(campaign.id)}
            disabled={buttonDisabled}
            color={buttonDisabled ? 'gold' : 'green'}
            size="sm"
          >
            {isOnCooldown
              ? `Cooldown: ${formatSeconds(cooldownRemaining)}`
              : availability === 'locked'
                ? 'Requirements Not Met'
                : isLeveled && !canUpgradeMore
                  ? 'Max Level'
                  : canAfford
                    ? `Upgrade`
                    : needText}
          </GameButton>
          {requirementDescriptions.length > 0 && availability === 'locked' && !isOnCooldown && canAfford && (
            <button
              onClick={handleRequirementsClick}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--bg-tertiary)] hover:bg-[var(--game-primary)] text-white rounded-full text-micro font-bold shadow-md transition-colors flex items-center justify-center z-10"
              title="Click to see requirements"
            >
              ?
            </button>
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

export function MarketingTab() {
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const { getDisplayLabel } = useMetricDisplayConfigs(industryId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(industryId);
  const availableCampaigns = useConfigStore(
    useCallback(
      (state) => {
        const campaigns = state.industryConfigs[industryId]?.marketingCampaigns;
        // Return campaigns from database only - no fallback to ensure we know when database is empty
        return campaigns && campaigns.length > 0 ? campaigns : [];
      },
      [industryId],
    ),
  );
  const campaignCooldowns = useGameStore((state) => state.campaignCooldowns);
  const campaignLevels = useGameStore((state) => state.campaignLevels);
  const campaignsActivatedThisMonth = useGameStore((state) => state.campaignsActivatedThisMonth);
  const getCampaignLevel = useGameStore((state) => state.getCampaignLevel);
  const startCampaign = useGameStore((state) => state.startCampaign);
  const metrics = useGameStore((state) => state.metrics);
  const gameTime = useGameStore((state) => state.gameTime);

  const activeCampaigns = useActiveMarketingCampaigns();
  const [message, setMessage] = useState<string | null>(null);

  const handleLaunch = (campaignId: string) => {
    const result = startCampaign(campaignId);
    // No message to display
    setMessage(null);
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div>
        <SectionHeading>Marketing Campaigns</SectionHeading>
        <p className="text-secondary text-xs sm:text-sm">
          Spend cash to run time-limited campaigns that boost demand and reputation.
        </p>
      </div>

      {/* Active Campaigns Section */}
      {activeCampaigns.length > 0 && (
        <Card>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Active Campaigns</span>
              <span className="text-xs text-secondary">({activeCampaigns.length})</span>
            </div>
            <div className="grid gap-2">
              {activeCampaigns.map((campaign) => (
                <div key={campaign.campaignId} className="p-3 bg-black/20 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">{campaign.campaignName}</span>
                    <span className="text-xs font-mono">
                      {formatSeconds(campaign.earliestExpiration)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {/* Comment out this to hide effect */}
                    {campaign.effects.map((effect: any, index: number) => (
                      <div key={`${effect.id}-${index}`} className="flex items-center justify-between text-xs">
                        <span className="text-secondary">
                          {effect.description || getDisplayLabel(effect.metric)}
                        </span>
                        {!effect.description && (
                          <span className="font-medium">
                            {effect.type === EffectType.Add && formatSigned(effect.value)}
                            {effect.type === EffectType.Percent && `${formatSigned(effect.value)}%`}
                            {effect.type === EffectType.Multiply && `×${formatValue(effect.value)}`}
                            {effect.type === EffectType.Set && `= ${formatValue(effect.value)}`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {message && (
        <Card variant="info" className="border-[var(--info)] bg-[var(--info)]/10">
          <p className="text-secondary text-xs sm:text-sm">{message}</p>
        </Card>
      )}

      {(() => {
        // Group campaigns by category and sort
        const sortedCategories = categories
          .sort((a, b) => a.orderIndex - b.orderIndex);

        const campaignsByCategory = new Map<string | undefined, typeof availableCampaigns>();

        // Group campaigns by category first
        sortedCategories.forEach(category => {
          const categoryCampaigns = availableCampaigns.filter(c => c.categoryId === category.id);
          if (categoryCampaigns.length > 0) {
            campaignsByCategory.set(category.id, categoryCampaigns);
          }
        });

        // Add uncategorized campaigns (others) at the end
        const uncategorizedCampaigns = availableCampaigns.filter(c => !c.categoryId);
        if (uncategorizedCampaigns.length > 0) {
          campaignsByCategory.set(undefined, uncategorizedCampaigns);
        }

        return (
          <div className="space-y-6">
            {Array.from(campaignsByCategory.entries()).map(([categoryId, categoryCampaigns]) => {
              const category = categoryId ? categories.find(c => c.id === categoryId) : null;
              const sortedCampaigns = categoryCampaigns.sort((a, b) => (a.order || 0) - (b.order || 0));

              return (
                <div key={categoryId || 'others'} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-semibold text-slate-200">
                        {category ? category.name : 'Others'}
                      </h3>
                    {category?.description && (
                      <span className="text-sm text-slate-400">• {category.description}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                    {sortedCampaigns.map((campaign) => {
                      const isLeveled = campaign.type === 'leveled';
                      const currentLevel = isLeveled ? getCampaignLevel(campaign.id) : 0;
                      
                      // Calculate affordability based on campaign type
                      let canAfford = true;
                      if (isLeveled) {
                        const maxLevel = campaign.maxLevel || (campaign.levels?.length || 0);
                        if (currentLevel < maxLevel) {
                          const nextLevelNumber = currentLevel + 1;
                          const levelConfig = campaign.levels?.find(l => l.level === nextLevelNumber) || campaign.levels?.[nextLevelNumber - 1];
                          if (levelConfig) {
                            const needsCash = levelConfig.cost > 0;
                            const needsTime = levelConfig.timeCost !== undefined && levelConfig.timeCost > 0;
                            const hasCash = !needsCash || metrics.cash >= levelConfig.cost;
                            const hasTime = !needsTime || metrics.myTime >= (levelConfig.timeCost ?? 0);
                            canAfford = hasCash && hasTime;
                          } else {
                            canAfford = false;
                          }
                        } else {
                          canAfford = false; // Max level reached
                        }
                      } else {
                        // Unlimited campaign
                        const needsCash = (campaign.cost ?? 0) > 0;
                        const needsTime = campaign.timeCost !== undefined && campaign.timeCost > 0;
                        const hasCash = !needsCash || metrics.cash >= (campaign.cost ?? 0);
                        const hasTime = !needsTime || metrics.myTime >= (campaign.timeCost ?? 0);
                        canAfford = hasCash && hasTime;
                      }
                      
                      const cooldownEnd = campaignCooldowns[campaign.id];
                      const isOnCooldown = !!(cooldownEnd && gameTime < cooldownEnd);
                      const cooldownRemaining = isOnCooldown ? Math.max(0, cooldownEnd - gameTime) : 0;

                      return (
                        <CampaignCard
                          key={campaign.id}
                          campaign={campaign}
                          canAfford={canAfford}
                          isOnCooldown={isOnCooldown}
                          cooldownRemaining={cooldownRemaining}
                          currentLevel={currentLevel}
                          wasActivatedThisMonth={campaignsActivatedThisMonth.has(campaign.id)}
                          onLaunch={handleLaunch}
                          metrics={{ cash: metrics.cash, time: metrics.myTime }}
                          getDisplayLabel={getDisplayLabel}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
