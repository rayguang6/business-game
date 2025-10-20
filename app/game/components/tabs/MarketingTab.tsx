'use client';

import React, { useMemo, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { getUpgradeEffects } from '@/lib/features/upgrades';
import { DEFAULT_INDUSTRY_ID, UpgradeEffect } from '@/lib/game/config';
import { combineEffects } from '@/lib/game/effects';
import { IndustryId } from '@/lib/game/types';

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
  const marketingEffects = useGameStore((state) => state.marketingEffects);
  const startCampaign = useGameStore((state) => state.startCampaign);
  const metrics = useGameStore((state) => state.metrics);
  const gameTime = useGameStore((state) => state.gameTime);
  const upgrades = useGameStore((state) => state.upgrades);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);

  const [message, setMessage] = useState<string | null>(null);

  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

  const upgradeEffects = useMemo(
    () => getUpgradeEffects(upgrades, industryId),
    [upgrades, industryId],
  );

  const combinedEffects = useMemo(
    () =>
      combineEffects(
        {
          upgrades: upgradeEffects,
          marketing: marketingEffects,
        },
        industryId,
      ),
    [upgradeEffects, marketingEffects, industryId],
  );

  const getPercentDelta = (effects: UpgradeEffect[], metric: UpgradeEffect['metric']) =>
    effects
      .filter((effect) => effect.metric === metric && effect.type === 'percent')
      .reduce((sum, effect) => sum + effect.value, 0);

  const getAddDelta = (effects: UpgradeEffect[], metric: UpgradeEffect['metric']) =>
    effects
      .filter((effect) => effect.metric === metric && effect.type === 'add')
      .reduce((sum, effect) => sum + effect.value, 0);

  const describeFlowEffect = (percent: number, add: number) => {
    const descriptions: string[] = [];
    if (percent !== 0) {
      const flowMultiplier = 1 / Math.max(0.1, 1 + percent);
      const flowPercent = (flowMultiplier - 1) * 100;
      descriptions.push(
        `Customer flow ${flowPercent >= 0 ? '+' : ''}${flowPercent.toFixed(0)}% (×${flowMultiplier.toFixed(1)})`,
      );
    }
    if (add !== 0) {
      descriptions.push(`Spawn interval ${add > 0 ? '+' : ''}${add.toFixed(1)}s`);
    }
    return descriptions;
  };

  const describeReputationEffect = (percent: number) => {
    if (percent === 0) return null;
    const reputationMultiplier = 1 + percent;
    const reputationPercent = percent * 100;
    return `Reputation gains ${reputationPercent >= 0 ? '+' : ''}${reputationPercent.toFixed(0)}% (×${reputationMultiplier.toFixed(1)})`;
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

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-xs text-gray-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <span className="text-gray-400">Spawn interval:</span>{' '}
            <span className="text-white font-semibold">
              {upgradeEffects.spawnIntervalSeconds.toFixed(2)}s
            </span>{' '}
            <span className="text-gray-400">→</span>{' '}
            <span className="text-green-300 font-semibold">
              {combinedEffects.spawnIntervalSeconds.toFixed(2)}s
            </span>{' '}
            <span className="text-gray-400">(×</span>
            <span className="text-green-300 font-semibold">
              {(upgradeEffects.spawnIntervalSeconds / combinedEffects.spawnIntervalSeconds).toFixed(1)}
            </span>
            <span className="text-gray-400"> flow)</span>
          </div>
          <div>
            <span className="text-gray-400">Reputation multiplier:</span>{' '}
            <span className="text-white font-semibold">
              {upgradeEffects.reputationMultiplier.toFixed(1)}x
            </span>{' '}
            <span className="text-gray-400">→</span>{' '}
            <span className="text-green-300 font-semibold">
              {combinedEffects.reputationMultiplier.toFixed(1)}x
            </span>
          </div>
        </div>
        <p className="text-gray-400 mt-2">
          (Left numbers show upgrade baseline; right numbers include active marketing boosts.)
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
          const spawnPercent = getPercentDelta(campaign.effects, 'spawnIntervalSeconds');
          const spawnAdd = getAddDelta(campaign.effects, 'spawnIntervalSeconds');
          const reputationPercent = getPercentDelta(campaign.effects, 'reputationMultiplier');
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
        {(() => {
          const activeFlow = (1 / Math.max(0.1, 1 + getPercentDelta(marketingEffects, 'spawnIntervalSeconds'))).toFixed(1);
          const activeFlowAdd = getAddDelta(marketingEffects, 'spawnIntervalSeconds');
          const activeReputation = (1 + getPercentDelta(marketingEffects, 'reputationMultiplier')).toFixed(1);

          const parts: string[] = [];
          if (activeFlow !== '1.0' || activeFlowAdd !== 0) {
            if (activeFlow !== '1.0') {
              parts.push(`Flow ×${activeFlow}`);
            }
            if (activeFlowAdd !== 0) {
              parts.push(`Spawn interval ${activeFlowAdd > 0 ? '+' : ''}${activeFlowAdd.toFixed(1)}s`);
            }
          }
          if (activeReputation !== '1.0') {
            parts.push(`Reputation ×${activeReputation}`);
          }

          if (parts.length === 0) {
            return <span className="text-gray-400">No active marketing modifiers.</span>;
          }

          return (
            <span>
              Active marketing modifiers: {parts.join(' · ')}
            </span>
          );
        })()}
      </div>
    </div>
  );
}
