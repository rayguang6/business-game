'use client';

import React, { useMemo } from 'react';
import GameButton from '@/app/components/ui/GameButton';
import { useGameStore } from '@/lib/store/gameStore';
import { getUpgradeSummary, getUpgradeCatalog } from '@/lib/features/upgrades';
import type { UpgradeEffect } from '@/lib/game/config';

const metricLabels: Record<string, string> = {
  treatmentRooms: 'Treatment Rooms',
  serviceSpeedMultiplier: 'Service Speed',
  spawnIntervalSeconds: 'Spawn Interval',
  reputationMultiplier: 'Reputation Gain',
  weeklyExpenses: 'Weekly Expenses',
};

type MetricKey = keyof typeof metricLabels;

const formatMetricValue = (metric: MetricKey, value: number): string => {
  switch (metric) {
    case 'treatmentRooms':
      return Math.round(value).toString();
    case 'weeklyExpenses':
      return `$${Math.round(value).toLocaleString()}`;
    case 'serviceSpeedMultiplier':
      return `×${value.toFixed(2)}`;
    case 'reputationMultiplier':
      return `×${value.toFixed(2)}`;
    case 'spawnIntervalSeconds':
      return `${value.toFixed(2)}s`;
    default:
      return value.toString();
  }
};

const formatEffect = (effect: UpgradeEffect): string => {
  const sign = effect.value >= 0 ? '+' : '';
  switch (effect.metric) {
    case 'treatmentRooms':
      return `${sign}${effect.value} treatment room${effect.value === 1 ? '' : 's'}`;
    case 'weeklyExpenses':
      return `${effect.value >= 0 ? '+' : '-'}$${Math.abs(effect.value)} weekly expenses`;
    case 'serviceSpeedMultiplier': {
      const percent = Math.round(effect.value * 100);
      const label = percent <= 0 ? 'faster service time' : 'slower service time';
      return `${percent > 0 ? '+' : ''}${percent}% ${label}`;
    }
    case 'reputationMultiplier': {
      const percent = Math.round(effect.value * 100);
      return `${percent >= 0 ? '+' : ''}${percent}% reputation gain`;
    }
    case 'spawnIntervalSeconds': {
      const percent = Math.round(effect.value * 100);
      const label = percent <= 0 ? 'faster customer spawns' : 'slower customer spawns';
      return `${percent > 0 ? '+' : ''}${percent}% ${label}`;
    }
    default:
      return `${sign}${effect.value}`;
  }
};

export function UpgradesTab() {
  const { upgrades, canAffordUpgrade, purchaseUpgrade } = useGameStore();

  const catalog = useMemo(() => getUpgradeCatalog(), []);
  const summary = useMemo(() => getUpgradeSummary(upgrades), [upgrades]);
  const purchased = useMemo(() => new Set(upgrades), [upgrades]);

  const handlePurchase = (upgradeId: string) => {
    const result = purchaseUpgrade(upgradeId);
    if (result.success) {
      console.log('✅', result.message);
    } else {
      console.log('❌', result.message);
    }
  };

  const metricsOverview = (Object.keys(metricLabels) as MetricKey[]).map((metric) => {
    const baseValue = summary.baseMetrics[metric];
    const currentValue = summary.currentMetrics[metric];
    const hasChanged = Math.abs(currentValue - baseValue) > 0.001;
    return (
      <div key={metric} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{metricLabels[metric]}</span>
          {hasChanged && (
            <span className="text-amber-300">Updated</span>
          )}
        </div>
        <div className="text-lg font-semibold text-white">
          {formatMetricValue(metric, currentValue)}
        </div>
        <div className="text-xs text-gray-500">
          Base: {formatMetricValue(metric, baseValue)}
        </div>
      </div>
    );
  });

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-bold mb-3 text-white">Upgrade Overview</h3>
        <p className="text-gray-300 text-sm mb-4">
          Purchase upgrades once to permanently improve your clinic. Each upgrade deducts its cost immediately and adjusts
          weekly expenses automatically.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {metricsOverview}
        </div>
      </section>

      <section>
        <h4 className="text-md font-semibold text-white mb-3">Available Upgrades</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalog.map((upgrade) => {
            const owned = purchased.has(upgrade.id);
            const canAfford = canAffordUpgrade(upgrade.cost);
            const effects = upgrade.effects.map(formatEffect);
            return (
              <div
                key={upgrade.id}
                className={`bg-gray-800 rounded-xl p-4 border transition ${
                  owned ? 'border-green-500/60' : 'border-gray-700 hover:border-indigo-500/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl" aria-hidden>{upgrade.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-white font-bold text-base">{upgrade.name}</h5>
                      <span className={`text-sm font-semibold ${owned ? 'text-green-400' : 'text-amber-300'}`}>
                        {owned ? 'Purchased' : `$${upgrade.cost.toLocaleString()}`}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1 mb-3">{upgrade.description}</p>
                    <ul className="text-xs text-gray-200 space-y-1">
                      {effects.map((effect) => (
                        <li key={effect} className="flex items-center gap-2">
                          <span className="text-indigo-300">•</span>
                          <span>{effect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <GameButton
                    color={owned ? 'gold' : canAfford ? 'blue' : 'gold'}
                    onClick={() => {
                      if (!owned && canAfford) {
                        handlePurchase(upgrade.id);
                      }
                    }}
                  >
                    {owned ? 'Purchased' : canAfford ? 'Buy Upgrade' : 'Need Cash'}
                  </GameButton>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
