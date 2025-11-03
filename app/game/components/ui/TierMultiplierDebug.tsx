'use client';

import React from 'react';
import { effectManager, GameMetric } from '@/lib/game/effectManager';

/**
 * Debug component to display current tier multipliers
 * Useful for testing the tier-based service effects system
 */
export function TierMultiplierDebug() {

  // Calculate current tier multipliers
  const tierRevenueMultipliers = {
    high: effectManager.calculate(GameMetric.HighTierServiceRevenueMultiplier, 1),
    mid: effectManager.calculate(GameMetric.MidTierServiceRevenueMultiplier, 1),
    low: effectManager.calculate(GameMetric.LowTierServiceRevenueMultiplier, 1),
  };

  const tierWeightageMultipliers = {
    high: effectManager.calculate(GameMetric.HighTierServiceWeightageMultiplier, 1),
    mid: effectManager.calculate(GameMetric.MidTierServiceWeightageMultiplier, 1),
    low: effectManager.calculate(GameMetric.LowTierServiceWeightageMultiplier, 1),
  };

  // Only show if any multipliers are different from 1
  const hasActiveEffects =
    tierRevenueMultipliers.high !== 1 || tierRevenueMultipliers.mid !== 1 || tierRevenueMultipliers.low !== 1 ||
    tierWeightageMultipliers.high !== 1 || tierWeightageMultipliers.mid !== 1 || tierWeightageMultipliers.low !== 1;

  if (!hasActiveEffects) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black/90 backdrop-blur-sm border border-blue-500/50 rounded-lg p-4 text-xs max-w-sm z-50">
      <div className="font-bold text-blue-300 mb-3">Tier Multipliers 🎯</div>

      <div className="space-y-3">
        {/* Revenue Multipliers */}
        <div>
          <div className="text-blue-200 font-semibold mb-1">Revenue Multipliers 💰</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className={`p-2 rounded ${tierRevenueMultipliers.high !== 1 ? 'bg-red-900/50 border border-red-500/30' : 'bg-gray-800/50'}`}>
              <div className="text-red-300 font-bold">High</div>
              <div className="text-white">{tierRevenueMultipliers.high.toFixed(2)}x</div>
            </div>
            <div className={`p-2 rounded ${tierRevenueMultipliers.mid !== 1 ? 'bg-yellow-900/50 border border-yellow-500/30' : 'bg-gray-800/50'}`}>
              <div className="text-yellow-300 font-bold">Mid</div>
              <div className="text-white">{tierRevenueMultipliers.mid.toFixed(2)}x</div>
            </div>
            <div className={`p-2 rounded ${tierRevenueMultipliers.low !== 1 ? 'bg-green-900/50 border border-green-500/30' : 'bg-gray-800/50'}`}>
              <div className="text-green-300 font-bold">Low</div>
              <div className="text-white">{tierRevenueMultipliers.low.toFixed(2)}x</div>
            </div>
          </div>
        </div>

        {/* Weightage Multipliers */}
        <div>
          <div className="text-blue-200 font-semibold mb-1">Weightage Multipliers 🎲</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className={`p-2 rounded ${tierWeightageMultipliers.high !== 1 ? 'bg-red-900/50 border border-red-500/30' : 'bg-gray-800/50'}`}>
              <div className="text-red-300 font-bold">High</div>
              <div className="text-white">{tierWeightageMultipliers.high.toFixed(2)}x</div>
            </div>
            <div className={`p-2 rounded ${tierWeightageMultipliers.mid !== 1 ? 'bg-yellow-900/50 border border-yellow-500/30' : 'bg-gray-800/50'}`}>
              <div className="text-yellow-300 font-bold">Mid</div>
              <div className="text-white">{tierWeightageMultipliers.mid.toFixed(2)}x</div>
            </div>
            <div className={`p-2 rounded ${tierWeightageMultipliers.low !== 1 ? 'bg-green-900/50 border border-green-500/30' : 'bg-gray-800/50'}`}>
              <div className="text-green-300 font-bold">Low</div>
              <div className="text-white">{tierWeightageMultipliers.low.toFixed(2)}x</div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-gray-500 text-[10px] mt-3 text-center">
        Debug view - tier effects active
      </div>
    </div>
  );
}
