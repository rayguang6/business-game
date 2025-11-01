'use client';

import React, { useMemo, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CampaignEffect } from '@/lib/store/slices/marketingSlice';
import { GameMetric, EffectType } from '@/lib/game/effectManager';

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

export function MarketingTab() {
  const availableCampaigns = useGameStore((state) => state.availableCampaigns);
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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white">Marketing Campaigns</h3>
        <p className="text-gray-300 text-sm">
          Spend cash to run time-limited campaigns that boost demand and reputation.
        </p>
      </div>

      {message && (
        <div className="bg-gray-800 border border-gray-700 text-gray-200 text-sm px-3 py-2 rounded">
          {message}
        </div>
      )}

      <div className="space-y-3">
        {availableCampaigns.map((campaign) => {
          const canAfford = metrics.cash >= campaign.cost;
          const cooldownEnd = campaignCooldowns[campaign.id];
          const isOnCooldown = !!(cooldownEnd && gameTime < cooldownEnd);
          const cooldownRemaining = isOnCooldown ? Math.max(0, cooldownEnd - gameTime) : 0;

          const descriptions = campaign.effects.map((effect) => ({
            text: describeEffect(effect),
            toneClass: getToneClass(effect),
          }));

          return (
            <div
              key={campaign.id}
              className="rounded-lg border p-4 space-y-3 bg-gray-800 border-gray-700"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-white font-semibold">{campaign.name}</h4>
                  <p className="text-gray-300 text-sm">{campaign.description}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="text-yellow-300 font-semibold">${campaign.cost}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                {descriptions.every((item) => !item.text) ? (
                  <span className="text-gray-400">No stat changes</span>
                ) : (
                  descriptions.map((item) => (
                    <span key={`${campaign.id}-${item.text}`} className={item.toneClass}>
                      {item.text}
                    </span>
                  ))
                )}
              </div>

              <button
                onClick={() => handleLaunch(campaign.id)}
                disabled={isOnCooldown}
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isOnCooldown
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : canAfford
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isOnCooldown
                  ? `Cooldown: ${formatSeconds(cooldownRemaining)}`
                  : canAfford
                  ? 'Launch Campaign'
                  : 'Not Enough Cash'}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
