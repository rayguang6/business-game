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
   * Final multipliers applied after effects. For example, { exp: 2 } modifies exp directly.
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
      case GameMetric.LeadsPerMonth: {
        const updated = applyUpgradeEffectMetric(result.leadsPerMonth, effect);
        const updatedLeadsPerMonth = Math.max(0, Math.round(updated));
        result = {
          ...result,
          leadsPerMonth: updatedLeadsPerMonth,
        };
        break;
      }
      case GameMetric.ServiceSpeedMultiplier: {
        const updated = Math.max(0.1, applyUpgradeEffectMetric(result.serviceSpeedMultiplier, effect));
        result = { ...result, serviceSpeedMultiplier: updated };
        break;
      }
      case GameMetric.Exp: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.exp, effect));
        result = { ...result, exp: updated };
        break;
      }
      case GameMetric.ServiceCapacity: {
        const updated = applyUpgradeEffectMetric(result.serviceCapacity, effect);
        result = { ...result, serviceCapacity: Math.max(1, Math.round(updated)) };
        break;
      }
      case GameMetric.MonthlyExpenses: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.monthlyExpenses, effect));
        result = { ...result, monthlyExpenses: updated };
        break;
      }
      // GameMetric.HappyProbability removed - not used in game mechanics
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
      case GameMetric.LeadsPerMonth: {
        // LeadsPerMonth multiplier: multiply the leads per month
        const updatedLeadsPerMonth = Math.max(0, Math.round(combined.leadsPerMonth * safeMultiplier));
        result = {
          ...result,
          leadsPerMonth: updatedLeadsPerMonth,
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
      case GameMetric.Exp: {
        result = {
          ...result,
          exp: Math.max(0, combined.exp * safeMultiplier),
        };
        break;
      }
      case GameMetric.ServiceCapacity: {
        result = {
          ...result,
          serviceCapacity: Math.max(1, Math.round(combined.serviceCapacity * safeMultiplier)),
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
      // GameMetric.HappyProbability removed - not used in game mechanics
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
