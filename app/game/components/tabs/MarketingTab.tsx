'use client';

import React, { useMemo, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
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

export function MarketingTab() {
  const availableCampaigns = useGameStore((state) => state.availableCampaigns);
  const activeCampaign = useGameStore((state) => state.activeCampaign);
  const campaignEndsAt = useGameStore((state) => state.campaignEndsAt);
  const startCampaign = useGameStore((state) => state.startCampaign);
  const metrics = useGameStore((state) => state.metrics);
  const gameTime = useGameStore((state) => state.gameTime);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);

  const [message, setMessage] = useState<string | null>(null);

  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

  // Helper functions for new CampaignEffect type
  const getPercentDelta = (effects: CampaignEffect[], metric: GameMetric) =>
    effects
      .filter((effect) => effect.metric === metric && effect.type === EffectType.Percent)
      .reduce((sum, effect) => sum + effect.value, 0);

  const getAddDelta = (effects: CampaignEffect[], metric: GameMetric) =>
    effects
      .filter((effect) => effect.metric === metric && effect.type === EffectType.Add)
      .reduce((sum, effect) => sum + effect.value, 0);

  const describeFlowEffect = (percent: number, add: number) => {
    const descriptions: string[] = [];
    if (percent !== 0) {
      const percentDecimal = percent / 100;
      const intervalMultiplier = 1 + percentDecimal;
      const safeIntervalMultiplier = intervalMultiplier <= 0 ? 0.1 : intervalMultiplier;
      const flowMultiplier = 1 / safeIntervalMultiplier;
      const flowPercent = (flowMultiplier - 1) * 100;
      descriptions.push(
        `Customer flow ${flowPercent >= 0 ? '+' : ''}${flowPercent.toFixed(0)}% (×${flowMultiplier.toFixed(2)})`,
      );
    }
    if (add !== 0) {
      descriptions.push(`Spawn interval ${add > 0 ? '+' : ''}${add.toFixed(1)}s`);
    }
    return descriptions;
  };

  const describeReputationEffect = (percent: number) => {
    if (percent === 0) return null;
    const reputationMultiplier = 1 + percent / 100;
    return `Reputation gains ${percent >= 0 ? '+' : ''}${percent.toFixed(0)}% (×${reputationMultiplier.toFixed(2)})`;
  };

  const remainingSeconds = useMemo(() => {
    if (!activeCampaign || campaignEndsAt == null) {
      return 0;
    }
    return Math.max(0, campaignEndsAt - gameTime);
  }, [activeCampaign, campaignEndsAt, gameTime]);

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
          const isActive = activeCampaign?.id === campaign.id;
          const isAnotherActive = Boolean(activeCampaign && !isActive);
          const spawnPercent = getPercentDelta(campaign.effects, GameMetric.SpawnIntervalSeconds);
          const spawnAdd = getAddDelta(campaign.effects, GameMetric.SpawnIntervalSeconds);
          const reputationPercent = getPercentDelta(campaign.effects, GameMetric.ReputationMultiplier);
          const flowDescriptions = describeFlowEffect(spawnPercent, spawnAdd);
          const reputationDescription = describeReputationEffect(reputationPercent);
          const canAfford = metrics.cash >= campaign.cost;

          return (
            <div
              key={campaign.id}
              className={`rounded-lg border p-4 space-y-3 ${
                isActive ? 'bg-blue-900/50 border-blue-600' : 'bg-gray-800 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-white font-semibold">{campaign.name}</h4>
                  <p className="text-gray-300 text-sm">{campaign.description}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="text-yellow-300 font-semibold">${campaign.cost}</div>
                  <div className="text-gray-400 text-xs">
                    Duration: {formatSeconds(campaign.durationSeconds)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                {flowDescriptions.map((item) => (
                  <span key={item} className="text-green-300">
                    {item}
                  </span>
                ))}
                {reputationDescription && (
                  <span key={reputationDescription} className="text-yellow-300">
                    {reputationDescription}
                  </span>
                )}
                {flowDescriptions.length === 0 && !reputationDescription && (
                  <span className="text-gray-400">No stat changes</span>
                )}
                {isActive && (
                  <span className="text-yellow-300">
                    Ends in {formatSeconds(remainingSeconds)}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleLaunch(campaign.id)}
                disabled={isActive || !canAfford || isAnotherActive}
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-green-700 text-white cursor-not-allowed'
                    : canAfford && !isAnotherActive
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isActive
                  ? 'Campaign Running'
                  : isAnotherActive
                  ? 'Another Campaign Active'
                  : canAfford
                  ? 'Launch Campaign'
                  : 'Not Enough Cash'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-400 border-t border-gray-800 pt-3">
        {activeCampaign ? (
          <span>
            Active marketing: <span className="text-emerald-400 font-semibold">{activeCampaign.name}</span>
          </span>
        ) : (
          <span className="text-gray-400">No active marketing campaign.</span>
        )}
      </div>
    </div>
  );
}
