'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { BUSINESS_STATS, BASE_UPGRADE_METRICS } from '@/lib/game/config';
import { getUpgradeEffects } from '@/lib/features/upgrades';

interface StatItem {
  label: string;
  value: string | number;
  baseValue?: string | number;
  icon: string;
  category: 'operation' | 'customer' | 'economics';
  description?: string;
}

export function HomeTab() {
  const { upgrades, weeklyExpenses } = useGameStore();
  
  const upgradeEffects = useMemo(() => getUpgradeEffects(upgrades), [upgrades]);
  
  const stats: StatItem[] = [
    // Operation Stats
    {
      label: 'Treatment Rooms',
      value: upgradeEffects.treatmentRooms,
      baseValue: BASE_UPGRADE_METRICS.treatmentRooms,
      icon: '🏥',
      category: 'operation',
      description: 'How many customers can be served at once',
    },
    {
      label: 'Service Speed',
      value: `×${upgradeEffects.serviceSpeedMultiplier.toFixed(2)}`,
      baseValue: '×1.00',
      icon: '⚡',
      category: 'operation',
      description: 'Service time multiplier (lower is faster)',
    },
    {
      label: 'Weekly Expenses',
      value: `$${weeklyExpenses}`,
      baseValue: `$${BASE_UPGRADE_METRICS.weeklyExpenses}`,
      icon: '💸',
      category: 'economics',
      description: 'Recurring costs deducted at week end',
    },
    
    // Customer Stats
    {
      label: 'Customer Spawn Interval',
      value: `${upgradeEffects.spawnIntervalSeconds.toFixed(1)}s`,
      baseValue: `${BASE_UPGRADE_METRICS.spawnIntervalSeconds.toFixed(1)}s`,
      icon: '🚶',
      category: 'customer',
      description: 'Time between new customers arriving',
    },
    {
      label: 'Customer Patience',
      value: `${BUSINESS_STATS.customerPatienceSeconds}s`,
      icon: '⏳',
      category: 'customer',
      description: 'How long customers wait before leaving angry',
    },
    {
      label: 'Reputation Multiplier',
      value: `×${upgradeEffects.reputationMultiplier.toFixed(2)}`,
      baseValue: '×1.00',
      icon: '⭐',
      category: 'customer',
      description: 'Reputation gain when customers are happy',
    },
    {
      label: 'Happy Probability',
      value: `${(BUSINESS_STATS.baseHappyProbability * 100).toFixed(0)}%`,
      icon: '😊',
      category: 'customer',
      description: 'Chance customer gives reputation after service',
    },
    
    // Economics Stats
    {
      label: 'Week Duration',
      value: `${BUSINESS_STATS.weekDurationSeconds}s`,
      icon: '📅',
      category: 'economics',
      description: 'How long each week lasts',
    },
    {
      label: 'Reputation per Happy Customer',
      value: BUSINESS_STATS.reputationGainPerHappyCustomer,
      icon: '💎',
      category: 'economics',
      description: 'Base reputation gain (before multiplier)',
    },
    {
      label: 'Reputation per Angry Customer',
      value: `-${BUSINESS_STATS.reputationLossPerAngryCustomer}`,
      icon: '😡',
      category: 'economics',
      description: 'Reputation lost when customer leaves angry',
    },
  ];
  
  const categories = {
    operation: { title: 'Operations', color: 'blue' },
    customer: { title: 'Customer Behavior', color: 'green' },
    economics: { title: 'Economics', color: 'purple' },
  };
  
  const hasUpgrades = upgrades.length > 0;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-2 text-white">Game Parameters</h3>
        <p className="text-gray-300 text-sm mb-4">
          Current game stats and parameters. Values in <span className="text-green-400">green</span> are modified by upgrades.
        </p>
      </div>
      
      {Object.entries(categories).map(([key, category]) => {
        const categoryStats = stats.filter(s => s.category === key);
        return (
          <section key={key}>
            <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
              <span className={`text-${category.color}-400`}>●</span>
              {category.title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryStats.map((stat) => {
                const hasChanged = stat.baseValue && stat.value !== stat.baseValue;
                return (
                  <div
                    key={stat.label}
                    className={`bg-gray-800 rounded-lg p-4 border transition ${
                      hasChanged ? 'border-green-500/40' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl" aria-hidden>{stat.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h5 className="text-white font-semibold text-sm truncate">{stat.label}</h5>
                          {hasChanged && hasUpgrades && (
                            <span className="text-xs text-green-400 flex-shrink-0">Modified</span>
                          )}
                        </div>
                        <div className={`text-xl font-bold mb-1 ${hasChanged ? 'text-green-400' : 'text-white'}`}>
                          {stat.value}
                        </div>
                        {stat.baseValue && hasChanged && (
                          <div className="text-xs text-gray-500 mb-2">
                            Base: {stat.baseValue}
                          </div>
                        )}
                        {stat.description && (
                          <p className="text-xs text-gray-400">{stat.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      
      {!hasUpgrades && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            💡 <strong>Tip:</strong> Purchase upgrades to see how they affect these parameters in real-time!
          </p>
        </div>
      )}
    </div>
  );
}
