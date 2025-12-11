'use client';

import React, { useCallback, useState, useMemo, useRef } from 'react';
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
import { MarketingCampaignCard } from '../ui/MarketingCampaignCard';
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
  if (durationMonths === null || durationMonths === undefined || !Number.isFinite(durationMonths) || durationMonths <= 0) {
    return '';
  }
  return ` for ${durationMonths} month`;
};


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
  const [launchingCampaigns, setLaunchingCampaigns] = useState<Set<string>>(new Set());
  const launchingCampaignsRef = useRef<Set<string>>(new Set());

  const handleLaunch = (campaignId: string) => {
    // Prevent multiple simultaneous launches using synchronous ref
    if (launchingCampaignsRef.current.has(campaignId)) {
      return;
    }

    // Immediately mark as launching (synchronous)
    launchingCampaignsRef.current.add(campaignId);

    // Update state for UI feedback
    setLaunchingCampaigns(prev => new Set(prev).add(campaignId));

    try {
      const result = startCampaign(campaignId);
      // No message to display
      setMessage(null);
    } finally {
      // Immediately allow new launches
      launchingCampaignsRef.current.delete(campaignId);
      setLaunchingCampaigns(prev => {
        const newSet = new Set(prev);
        newSet.delete(campaignId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div>
        <SectionHeading>Marketing Campaigns</SectionHeading>
        <p className="text-secondary text-sm sm:text-sm">
          Spend cash to run time-limited campaigns that boost demand and reputation.
        </p>
      </div>

      {/* Active Campaigns Section */}
      {activeCampaigns.length > 0 && (
        <Card>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Active Campaigns</span>
              <span className="text-sm text-secondary">({activeCampaigns.length})</span>
            </div>
            <div className="grid gap-2">
              {activeCampaigns.map((campaign) => (
                <div key={campaign.campaignId} className="p-3 bg-black/20 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">{campaign.campaignName}</span>
                    <span className="text-sm font-mono">
                      {formatSeconds(campaign.earliestExpiration)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {/* Comment out this to hide effect */}
                    {campaign.effects.map((effect: any, index: number) => (
                      <div key={`${effect.id}-${index}`} className="flex items-center justify-between text-sm">
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
          <p className="text-secondary text-sm sm:text-sm">{message}</p>
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
          <div className="space-y-3 sm:space-y-5 md:space-y-6">
            {Array.from(campaignsByCategory.entries()).map(([categoryId, categoryCampaigns]) => {
              const category = categoryId ? categories.find(c => c.id === categoryId) : null;
              const sortedCampaigns = categoryCampaigns.sort((a, b) => (a.order || 0) - (b.order || 0));

              return (
                <div key={categoryId || 'others'} className="bg-slate-800/50 border border-slate-700 rounded-xl p-2 sm:p-4 md:p-6">
                  <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-semibold text-slate-200">
                        {category ? category.name : 'Others'}
                      </h3>
                    {category?.description && (
                      <span className="text-sm text-slate-400">• {category.description}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                        <MarketingCampaignCard
                          key={campaign.id}
                          campaign={campaign}
                          canAfford={canAfford}
                          isOnCooldown={isOnCooldown}
                          cooldownRemaining={cooldownRemaining}
                          currentLevel={currentLevel}
                          wasActivatedThisMonth={campaignsActivatedThisMonth.has(campaign.id)}
                          isLaunching={launchingCampaigns.has(campaign.id)}
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
