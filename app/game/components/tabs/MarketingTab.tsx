'use client';

import React, { useCallback, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CampaignEffect, MarketingCampaign, FALLBACK_CAMPAIGNS } from '@/lib/store/slices/marketingSlice';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { useRequirements } from '@/lib/hooks/useRequirements';
import { useConfigStore } from '@/lib/store/configStore';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
import { Card } from '@/app/components/ui/Card';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { Modal } from '@/app/components/ui/Modal';

const formatSeconds = (seconds: number): string => {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  if (mins <= 0) {
    return `${secs}s`;
  }
  return `${mins}m ${secs}s`;
};

const METRIC_LABELS: Record<GameMetric, string> = {
  [GameMetric.SpawnIntervalSeconds]: 'Customer flow',
  [GameMetric.ServiceSpeedMultiplier]: 'Service speed',
  [GameMetric.ServiceRooms]: 'Service rooms',
  [GameMetric.ReputationMultiplier]: 'Reputation gains',
  [GameMetric.HappyProbability]: 'Happy customer chance',
  [GameMetric.MonthlyExpenses]: 'Monthly expenses',
  [GameMetric.ServiceRevenueMultiplier]: 'Service revenue',
  [GameMetric.ServiceRevenueFlatBonus]: 'Average ticket',
  [GameMetric.FounderWorkingHours]: 'Founder working hours',
  // Tier-specific metrics
  [GameMetric.HighTierServiceRevenueMultiplier]: 'High-tier revenue',
  [GameMetric.HighTierServiceWeightageMultiplier]: 'High-tier selection',
  [GameMetric.MidTierServiceRevenueMultiplier]: 'Mid-tier revenue',
  [GameMetric.MidTierServiceWeightageMultiplier]: 'Mid-tier selection',
  [GameMetric.LowTierServiceRevenueMultiplier]: 'Low-tier revenue',
  [GameMetric.LowTierServiceWeightageMultiplier]: 'Low-tier selection',
};

const formatValue = (value: number): string => {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/0+$/u, '').replace(/\.$/u, '');
};

const formatSigned = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatValue(value)}`;
};

const formatDurationLabel = (durationSeconds: number | null | undefined): string => {
  if (durationSeconds === null || durationSeconds === undefined || !Number.isFinite(durationSeconds)) {
    return ' (Permanent)';
  }
  if (durationSeconds <= 0) {
    return ' (Instant)';
  }
  return ` for ${durationSeconds}s`;
};

const describeEffect = (effect: CampaignEffect): string => {
  const label = METRIC_LABELS[effect.metric] ?? effect.metric;
  const durationLabel = formatDurationLabel(effect.durationSeconds);

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
  onLaunch: (campaignId: string) => void;
}

function CampaignCard({ campaign, canAfford, isOnCooldown, cooldownRemaining, onLaunch, metrics }: CampaignCardProps & { metrics: { cash: number; time: number } }) {
  const { areMet: requirementsMet, descriptions: requirementDescriptions } = useRequirements(campaign.requirements);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const needsCash = campaign.cost > 0;
  const needsTime = campaign.timeCost !== undefined && campaign.timeCost > 0;
  
  // Determine what's missing for button text
  const missing: string[] = [];
  if (needsCash && metrics.cash < campaign.cost) missing.push('Cash');
  if (needsTime && metrics.time < campaign.timeCost!) missing.push('Time');
  const needText = missing.length > 0 ? `Not Enough ${missing.join(' + ')}` : 'Not Enough Cash';

  const descriptions = campaign.effects.map((effect) => ({
    text: describeEffect(effect),
    toneClass: getToneClass(effect),
  }));

  const buttonDisabled = isOnCooldown || !canAfford || !requirementsMet;

  const handleRequirementsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRequirementsModal(true);
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-primary font-semibold">{campaign.name}</h4>
          <p className="text-secondary text-sm">{campaign.description}</p>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold" style={{ color: 'var(--game-secondary)' }}>
            {(() => {
              const costParts: string[] = [];
              if (needsCash) costParts.push(`$${campaign.cost.toLocaleString()}`);
              if (needsTime) costParts.push(`${campaign.timeCost}h`);
              return costParts.join(' + ') || 'Free';
            })()}
          </div>
        </div>
      </div>

      {/* Requirements Modal */}
      <Modal
        isOpen={showRequirementsModal}
        onClose={() => setShowRequirementsModal(false)}
        maxWidth="sm"
      >
        <div className="text-center text-secondary text-sm leading-relaxed space-y-1">
          <h3 className="text-primary font-semibold mb-3">Requirements</h3>
          {requirementDescriptions.map((desc, idx) => (
            <div key={idx}>{desc}</div>
          ))}
        </div>
      </Modal>

      <div className="flex flex-wrap items-center gap-3 text-xs text-secondary">
        {descriptions.every((item) => !item.text) ? (
          <span className="text-muted">No stat changes</span>
        ) : (
          descriptions.map((item) => (
            <span key={`${campaign.id}-${item.text}`} className={item.toneClass}>
              {item.text}
            </span>
          ))
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => onLaunch(campaign.id)}
          disabled={buttonDisabled}
          className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors min-h-[44px] ${
            buttonDisabled
              ? 'bg-[var(--bg-tertiary)] text-tertiary cursor-not-allowed border-2 border-[var(--border-primary)]'
              : 'bg-[var(--success)] hover:bg-[var(--success-dark)] text-white border-2 border-[var(--success)]'
          }`}
        >
          {isOnCooldown
            ? `Cooldown: ${formatSeconds(cooldownRemaining)}`
            : !requirementsMet
              ? 'Requirements Not Met'
              : canAfford
                ? 'Launch Campaign'
                : needText}
        </button>
        {requirementDescriptions.length > 0 && !requirementsMet && !isOnCooldown && canAfford && (
          <button
            onClick={handleRequirementsClick}
            className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--bg-tertiary)] hover:bg-[var(--game-primary)] text-white rounded-full text-xs font-bold shadow-md transition-colors flex items-center justify-center z-10 min-w-[20px] min-h-[20px]"
            title="Click to see requirements"
          >
            ?
          </button>
        )}
      </div>
    </Card>
  );
}

export function MarketingTab() {
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const availableCampaigns = useConfigStore(
    useCallback(
      (state) => {
        const campaigns = state.industryConfigs[industryId]?.marketingCampaigns;
        return campaigns && campaigns.length > 0 ? campaigns : FALLBACK_CAMPAIGNS;
      },
      [industryId],
    ),
  );
  const campaignCooldowns = useGameStore((state) => state.campaignCooldowns);
  const startCampaign = useGameStore((state) => state.startCampaign);
  const metrics = useGameStore((state) => state.metrics);
  const gameTime = useGameStore((state) => state.gameTime);

  const [message, setMessage] = useState<string | null>(null);

  const handleLaunch = (campaignId: string) => {
    const result = startCampaign(campaignId);
    setMessage(result.message);
  };

  return (
    <div className="space-y-6">
      <div>
        <SectionHeading>Marketing Campaigns</SectionHeading>
        <p className="text-secondary text-sm">
          Spend cash to run time-limited campaigns that boost demand and reputation.
        </p>
      </div>

      {message && (
        <Card variant="info" className="border-[var(--info)] bg-[var(--info)]/10">
          <p className="text-secondary text-sm">{message}</p>
        </Card>
      )}

      <div className="space-y-3">
        {availableCampaigns.map((campaign) => {
          const needsCash = campaign.cost > 0;
          const needsTime = campaign.timeCost !== undefined && campaign.timeCost > 0;
          const hasCash = !needsCash || metrics.cash >= campaign.cost;
          const hasTime = !needsTime || metrics.time >= campaign.timeCost!;
          const canAfford = hasCash && hasTime;
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
              onLaunch={handleLaunch}
              metrics={metrics}
            />
          );
        })}
      </div>
    </div>
  );
}
