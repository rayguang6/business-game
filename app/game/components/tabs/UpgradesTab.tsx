'use client';

import React, { useMemo } from 'react';
import GameButton from '@/app/components/ui/GameButton';
import { useGameStore } from '@/lib/store/gameStore';
import { getUpgradeSummary, getUpgradeCatalog } from '@/lib/features/upgrades';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { UpgradeEffect } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { GameMetric } from '@/lib/game/effectManager';

const metricLabels: Record<string, string> = {
  treatmentRooms: 'Treatment Rooms',
  serviceSpeedMultiplier: 'Service Speed',
  spawnIntervalSeconds: 'Spawn Interval',
  monthlyExpenses: 'Monthly Expenses',
};

type MetricKey = keyof typeof metricLabels;

const formatMetricValue = (metric: MetricKey, value: number): string => {
  switch (metric) {
    case 'treatmentRooms':
      return Math.round(value).toString();
    case 'monthlyExpenses':
      return `$${Math.round(value).toLocaleString()}`;
    case 'serviceSpeedMultiplier':
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
    case GameMetric.ServiceRooms:
      return `${sign}${effect.value} treatment room${effect.value === 1 ? '' : 's'}`;
    case GameMetric.MonthlyExpenses:
      return `${effect.value >= 0 ? '+' : '-'}$${Math.abs(effect.value)} monthly expenses`;
    case GameMetric.ServiceSpeedMultiplier: {
      const percent = Math.round(effect.value);
      return `${percent >= 0 ? '+' : ''}${percent}% service speed`;
    }
    case GameMetric.SpawnIntervalSeconds: {
      const percent = Math.round(effect.value);
      const isIncrease = percent >= 0;
      const label = isIncrease ? 'faster customer spawns' : 'slower customer spawns';
      return `${isIncrease ? '+' : ''}${percent}% ${label}`;
    }
    default:
      return `${sign}${effect.value}`;
  }
};

export function UpgradesTab() {
  const {
    upgrades,
    canAffordUpgrade,
    getUpgradeLevel,
    canUpgradeMore,
    purchaseUpgrade,
    selectedIndustry,
  } = useGameStore();
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

  const catalog = useMemo(() => getUpgradeCatalog(industryId), [industryId]);
  const summary = useMemo(() => getUpgradeSummary(upgrades, industryId), [upgrades, industryId]);

  const handlePurchase = (upgradeId: string) => {
    const result = purchaseUpgrade(upgradeId);
    if (result.success) {
      console.log('✅', result.message);
    } else {
      console.log('❌', result.message);
    }
  };

  const metricsOverview = (Object.keys(metricLabels) as MetricKey[]).map((metric) => {
    const baseValue = summary.baseMetrics[metric as keyof typeof summary.baseMetrics];
    const currentValue = summary.currentMetrics[metric as keyof typeof summary.currentMetrics];
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
          monthly expenses automatically.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {metricsOverview}
        </div>
      </section>

      <section>
        <h4 className="text-md font-semibold text-white mb-3">Available Upgrades</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalog.map((upgrade) => {
            const currentLevel = getUpgradeLevel(upgrade.id);
            const canBuyMore = canUpgradeMore(upgrade.id);
            const canAfford = canAffordUpgrade(upgrade.cost);
            const isMaxed = currentLevel >= upgrade.maxLevel;
            const effects = upgrade.effects.map(formatEffect);
            const buttonDisabled = isMaxed || !canAfford;
            
            return (
              <div
                key={upgrade.id}
                className={`bg-gray-800 rounded-xl p-4 border transition ${
                  currentLevel > 0 ? 'border-green-500/60' : 'border-gray-700 hover:border-indigo-500/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl" aria-hidden>{upgrade.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h5 className="text-white font-bold text-base">{upgrade.name}</h5>
                        {upgrade.maxLevel > 1 && (
                          <span className="text-xs text-gray-400">
                            Lvl {currentLevel}/{upgrade.maxLevel}
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isMaxed ? 'text-green-400' : 'text-amber-300'}`}>
                        {isMaxed ? 'Max' : `$${upgrade.cost.toLocaleString()}`}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1 mb-3">{upgrade.description}</p>
                    <ul className="text-xs text-gray-200 space-y-1">
                      {effects.map((effect, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-indigo-300">•</span>
                          <span>{effect}</span>
                          {currentLevel > 0 && upgrade.maxLevel > 1 && (
                            <span className="text-green-400 ml-1">
                              (×{currentLevel})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <GameButton
                    color={isMaxed ? 'gold' : canAfford ? 'blue' : 'gold'}
                    className="w-full sm:w-auto"
                    disabled={buttonDisabled}
                    onClick={() => {
                      if (!buttonDisabled) {
                        handlePurchase(upgrade.id);
                      }
                    }}
                  >
                    {isMaxed ? 'Max Level' : canAfford ? (currentLevel > 0 ? 'Upgrade' : 'Buy') : 'Need Cash'}
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
