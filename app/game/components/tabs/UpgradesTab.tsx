'use client';

import React, { useMemo } from 'react';
import GameButton from '@/app/components/ui/GameButton';
import { useGameStore } from '@/lib/store/gameStore';
import { getUpgradeCatalog } from '@/lib/features/upgrades';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { UpgradeEffect } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';

const METRIC_LABELS: Partial<Record<GameMetric, string>> = {
  [GameMetric.ServiceRooms]: 'Service Rooms',
  [GameMetric.MonthlyExpenses]: 'Monthly Expenses',
  [GameMetric.ServiceSpeedMultiplier]: 'Service Speed',
  [GameMetric.SpawnIntervalSeconds]: 'Customer Spawn',
  [GameMetric.ReputationMultiplier]: 'Reputation',
  [GameMetric.HappyProbability]: 'Happy Chance',
  [GameMetric.ServiceRevenueMultiplier]: 'Service Price',
  [GameMetric.ServiceRevenueFlatBonus]: 'Service Price',
};

const formatMagnitude = (value: number): string => {
  return Number.isInteger(value) ? Math.abs(value).toString() : Math.abs(value).toFixed(2);
};

const formatRawNumber = (value: number): string => {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

const formatCurrency = (value: number): string => `$${Math.abs(value).toLocaleString()}`;
const formatRawCurrency = (value: number): string => `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString()}`;

const formatEffect = (effect: UpgradeEffect): string => {
  const { metric, type, value } = effect;
  const label = METRIC_LABELS[metric] ?? metric;
  const sign = value >= 0 ? '+' : '-';
  const absValue = Math.abs(value);

  if (type === EffectType.Add) {
    switch (metric) {
      case GameMetric.MonthlyExpenses:
      case GameMetric.ServiceRevenueFlatBonus:
        return `${sign}${formatCurrency(value)} ${label}`;
      case GameMetric.SpawnIntervalSeconds:
        return `${sign}${formatMagnitude(value)}s ${label} Interval`;
      case GameMetric.ServiceRooms:
        return `${sign}${formatMagnitude(value)} ${label}`;
      default:
        return `${sign}${formatMagnitude(value)} ${label}`;
    }
  }

  if (type === EffectType.Percent) {
    const percent = Math.round(absValue);
    switch (metric) {
      case GameMetric.SpawnIntervalSeconds:
        return `${sign}${percent}% Customer Spawn Rate`;
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
      case GameMetric.SpawnIntervalSeconds:
        return `Set ${label} Interval to ${formatRawNumber(value)}s`;
      default:
        return `Set ${label} to ${formatRawNumber(value)}`;
    }
  }

  return `${sign}${formatMagnitude(value)} ${label}`;
};

export function UpgradesTab() {
  const {
    canAffordUpgrade,
    getUpgradeLevel,
    canUpgradeMore,
    purchaseUpgrade,
    selectedIndustry,
  } = useGameStore();
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

  const catalog = useMemo(() => getUpgradeCatalog(industryId), [industryId]);

  const handlePurchase = (upgradeId: string) => {
    const result = purchaseUpgrade(upgradeId);
    if (result.success) {
      console.log('✅', result.message);
    } else {
      console.log('❌', result.message);
    }
  };

  return (
    <div className="space-y-6">
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
