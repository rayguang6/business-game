import { UpgradeEffects } from '@/lib/features/upgrades';
import { IndustryId } from '@/lib/game/types';
import { getTicksPerSecondForIndustry } from '@/lib/game/config';
import { UpgradeEffect } from '@/lib/game/config';
import { EffectType, GameMetric } from '@/lib/game/effectManager';

export type EffectMultiplierMap = Partial<Record<GameMetric, number>>;

export interface EffectBundle {
  /**
   * Identifier for debugging/logging (e.g., "staff", "marketing")
   */
  id?: string;
  /**
   * Upgrade-style effects applied sequentially using (value + add) * (1 + percent)
   */
  effects?: UpgradeEffect[];
  /**
   * Final multipliers applied after effects. For example, { reputationMultiplier: 2 } doubles the current value.
   */
  multipliers?: EffectMultiplierMap;
}

export interface EffectSources {
  base: UpgradeEffects;
  bundles?: EffectBundle[];
}

const applyUpgradeEffectMetric = (
  value: number,
  effect: UpgradeEffect,
): number => {
  switch (effect.type) {
    case EffectType.Add:
      return value + effect.value;
    case EffectType.Percent:
      return value * (1 + effect.value / 100);
    case EffectType.Multiply:
      return value * effect.value;
    case EffectType.Set:
      return effect.value;
    default:
      return value;
  }
};

const applyUpgradeEffectsToCombined = (
  combined: UpgradeEffects,
  effects: UpgradeEffect[],
  industryId: IndustryId,
): UpgradeEffects => {
  if (effects.length === 0) {
    return combined;
  }

  let result: UpgradeEffects = { ...combined };

  effects.forEach((effect) => {
    switch (effect.metric) {
      case GameMetric.SpawnIntervalSeconds: {
        let updatedSeconds = result.spawnIntervalSeconds;
        switch (effect.type) {
          case EffectType.Add:
            updatedSeconds = result.spawnIntervalSeconds + effect.value;
            break;
          case EffectType.Percent: {
            const divisor = Math.max(0.01, 1 + effect.value / 100);
            updatedSeconds = result.spawnIntervalSeconds / divisor;
            break;
          }
          case EffectType.Multiply: {
            const divisor = Math.max(0.01, Math.abs(effect.value));
            updatedSeconds = result.spawnIntervalSeconds / divisor;
            break;
          }
          case EffectType.Set:
            updatedSeconds = effect.value;
            break;
          default:
            break;
        }
        updatedSeconds = Math.max(0.1, updatedSeconds);
        const ticksPerSecond = getTicksPerSecondForIndustry(industryId);
        result = {
          ...result,
          spawnIntervalSeconds: updatedSeconds,
          spawnIntervalTicks: Math.max(1, Math.round(updatedSeconds * ticksPerSecond)),
        };
        break;
      }
      case GameMetric.ServiceSpeedMultiplier: {
        const updated = Math.max(0.1, applyUpgradeEffectMetric(result.serviceSpeedMultiplier, effect));
        result = { ...result, serviceSpeedMultiplier: updated };
        break;
      }
      case GameMetric.ReputationMultiplier: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.reputationMultiplier, effect));
        result = { ...result, reputationMultiplier: updated };
        break;
      }
      case GameMetric.ServiceRooms: {
        const updated = applyUpgradeEffectMetric(result.treatmentRooms, effect);
        result = { ...result, treatmentRooms: Math.max(1, Math.round(updated)) };
        break;
      }
      case GameMetric.MonthlyExpenses: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.monthlyExpenses, effect));
        result = { ...result, monthlyExpenses: updated };
        break;
      }
      case GameMetric.HappyProbability: {
        const updated = applyUpgradeEffectMetric(result.happyProbability, effect);
        result = { ...result, happyProbability: Math.max(0, Math.min(1, updated)) };
        break;
      }
      case GameMetric.ServiceRevenueMultiplier: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.serviceRevenueMultiplier, effect));
        result = { ...result, serviceRevenueMultiplier: updated };
        break;
      }
      case GameMetric.ServiceRevenueFlatBonus: {
        const updated = applyUpgradeEffectMetric(result.serviceRevenueFlatBonus, effect);
        result = { ...result, serviceRevenueFlatBonus: Math.max(-100000, updated) };
        break;
      }
      // Tier-specific service revenue multipliers
      case GameMetric.HighTierServiceRevenueMultiplier: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.highTierServiceRevenueMultiplier || 1, effect));
        result = { ...result, highTierServiceRevenueMultiplier: updated };
        break;
      }
      case GameMetric.MidTierServiceRevenueMultiplier: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.midTierServiceRevenueMultiplier || 1, effect));
        result = { ...result, midTierServiceRevenueMultiplier: updated };
        break;
      }
      case GameMetric.LowTierServiceRevenueMultiplier: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.lowTierServiceRevenueMultiplier || 1, effect));
        result = { ...result, lowTierServiceRevenueMultiplier: updated };
        break;
      }
      // Tier-specific service weightage multipliers
      case GameMetric.HighTierServiceWeightageMultiplier: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.highTierServiceWeightageMultiplier || 1, effect));
        result = { ...result, highTierServiceWeightageMultiplier: updated };
        break;
      }
      case GameMetric.MidTierServiceWeightageMultiplier: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.midTierServiceWeightageMultiplier || 1, effect));
        result = { ...result, midTierServiceWeightageMultiplier: updated };
        break;
      }
      case GameMetric.LowTierServiceWeightageMultiplier: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.lowTierServiceWeightageMultiplier || 1, effect));
        result = { ...result, lowTierServiceWeightageMultiplier: updated };
        break;
      }
      default:
        break;
    }
  });

  return result;
};

const applyMultipliersToCombined = (
  combined: UpgradeEffects,
  multipliers: EffectMultiplierMap,
  industryId: IndustryId,
): UpgradeEffects => {
  let result: UpgradeEffects = { ...combined };

  (Object.entries(multipliers) as [GameMetric, number | undefined][]).forEach(([metric, multiplier]) => {
    if (multiplier === undefined || Number.isNaN(multiplier)) {
      return;
    }
    const safeMultiplier = Math.max(0, multiplier);
    switch (metric) {
      case GameMetric.SpawnIntervalSeconds: {
        const divisor = Math.max(0.01, safeMultiplier);
        const updatedSeconds = Math.max(0.1, combined.spawnIntervalSeconds / divisor);
        const ticksPerSecond = getTicksPerSecondForIndustry(industryId);
        result = {
          ...result,
          spawnIntervalSeconds: updatedSeconds,
          spawnIntervalTicks: Math.max(1, Math.round(updatedSeconds * ticksPerSecond)),
        };
        break;
      }
      case GameMetric.ServiceSpeedMultiplier: {
        result = {
          ...result,
          serviceSpeedMultiplier: Math.max(0.1, combined.serviceSpeedMultiplier * safeMultiplier),
        };
        break;
      }
      case GameMetric.ReputationMultiplier: {
        result = {
          ...result,
          reputationMultiplier: Math.max(0, combined.reputationMultiplier * safeMultiplier),
        };
        break;
      }
      case GameMetric.ServiceRooms: {
        result = {
          ...result,
          treatmentRooms: Math.max(1, Math.round(combined.treatmentRooms * safeMultiplier)),
        };
        break;
      }
      case GameMetric.MonthlyExpenses: {
        result = {
          ...result,
          monthlyExpenses: Math.max(0, combined.monthlyExpenses * safeMultiplier),
        };
        break;
      }
      case GameMetric.HappyProbability: {
        result = {
          ...result,
          happyProbability: Math.max(0, Math.min(1, combined.happyProbability * safeMultiplier)),
        };
        break;
      }
      case GameMetric.ServiceRevenueMultiplier: {
        result = {
          ...result,
          serviceRevenueMultiplier: Math.max(0, combined.serviceRevenueMultiplier * safeMultiplier),
        };
        break;
      }
      case GameMetric.ServiceRevenueFlatBonus: {
        result = {
          ...result,
          serviceRevenueFlatBonus: Math.max(-100000, combined.serviceRevenueFlatBonus * safeMultiplier),
        };
        break;
      }
      // Tier-specific service revenue multipliers
      case GameMetric.HighTierServiceRevenueMultiplier: {
        result = {
          ...result,
          highTierServiceRevenueMultiplier: Math.max(0, (combined.highTierServiceRevenueMultiplier || 1) * safeMultiplier),
        };
        break;
      }
      case GameMetric.MidTierServiceRevenueMultiplier: {
        result = {
          ...result,
          midTierServiceRevenueMultiplier: Math.max(0, (combined.midTierServiceRevenueMultiplier || 1) * safeMultiplier),
        };
        break;
      }
      case GameMetric.LowTierServiceRevenueMultiplier: {
        result = {
          ...result,
          lowTierServiceRevenueMultiplier: Math.max(0, (combined.lowTierServiceRevenueMultiplier || 1) * safeMultiplier),
        };
        break;
      }
      // Tier-specific service weightage multipliers
      case GameMetric.HighTierServiceWeightageMultiplier: {
        result = {
          ...result,
          highTierServiceWeightageMultiplier: Math.max(0, (combined.highTierServiceWeightageMultiplier || 1) * safeMultiplier),
        };
        break;
      }
      case GameMetric.MidTierServiceWeightageMultiplier: {
        result = {
          ...result,
          midTierServiceWeightageMultiplier: Math.max(0, (combined.midTierServiceWeightageMultiplier || 1) * safeMultiplier),
        };
        break;
      }
      case GameMetric.LowTierServiceWeightageMultiplier: {
        result = {
          ...result,
          lowTierServiceWeightageMultiplier: Math.max(0, (combined.lowTierServiceWeightageMultiplier || 1) * safeMultiplier),
        };
        break;
      }
      default:
        break;
    }
  });

  return result;
};

export function combineEffects(
  sources: EffectSources,
  industryId: IndustryId,
): UpgradeEffects {
  let combined: UpgradeEffects = { ...sources.base };

  (sources.bundles ?? []).forEach((bundle) => {
    if (!bundle) return;

    if (bundle.effects && bundle.effects.length > 0) {
      combined = applyUpgradeEffectsToCombined(combined, bundle.effects, industryId);
    }

    if (bundle.multipliers && Object.keys(bundle.multipliers).length > 0) {
      combined = applyMultipliersToCombined(combined, bundle.multipliers, industryId);
    }
  });

  return combined;
}
