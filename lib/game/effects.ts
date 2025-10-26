import { UpgradeEffects } from '@/lib/features/upgrades';
import { IndustryId } from '@/lib/game/types';
import { getTicksPerSecondForIndustry } from '@/lib/game/config';
import { UpgradeEffect, UpgradeMetric } from '@/lib/game/config';

export type EffectMultiplierMap = Partial<Record<UpgradeMetric, number>>;

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
  if (effect.type === 'add') {
    return value + effect.value;
  }
  return value * (1 + effect.value);
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
      case UpgradeMetric.SpawnIntervalSeconds: {
        const updatedSeconds = Math.max(
          0.1,
          applyUpgradeEffectMetric(result.spawnIntervalSeconds, effect),
        );
        const ticksPerSecond = getTicksPerSecondForIndustry(industryId);
        result = {
          ...result,
          spawnIntervalSeconds: updatedSeconds,
          spawnIntervalTicks: Math.max(1, Math.round(updatedSeconds * ticksPerSecond)),
        };
        break;
      }
      case UpgradeMetric.ServiceSpeedMultiplier: {
        const updated = Math.max(0.1, applyUpgradeEffectMetric(result.serviceSpeedMultiplier, effect));
        result = { ...result, serviceSpeedMultiplier: updated };
        break;
      }
      case UpgradeMetric.ReputationMultiplier: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.reputationMultiplier, effect));
        result = { ...result, reputationMultiplier: updated };
        break;
      }
      case UpgradeMetric.TreatmentRooms: {
        const updated = applyUpgradeEffectMetric(result.treatmentRooms, effect);
        result = { ...result, treatmentRooms: Math.max(1, Math.round(updated)) };
        break;
      }
      case UpgradeMetric.WeeklyExpenses: {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.weeklyExpenses, effect));
        result = { ...result, weeklyExpenses: updated };
        break;
      }
      case UpgradeMetric.HappyProbability: {
        const updated = applyUpgradeEffectMetric(result.happyProbability, effect);
        result = { ...result, happyProbability: Math.max(0, Math.min(1, updated)) };
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

  Object.entries(multipliers).forEach(([metric, multiplier]) => {
    if (multiplier === undefined || Number.isNaN(multiplier)) {
      return;
    }
    const safeMultiplier = Math.max(0, multiplier);
    switch (metric as UpgradeMetric) {
      case UpgradeMetric.SpawnIntervalSeconds: {
        const updatedSeconds = Math.max(0.1, combined.spawnIntervalSeconds * safeMultiplier);
        const ticksPerSecond = getTicksPerSecondForIndustry(industryId);
        result = {
          ...result,
          spawnIntervalSeconds: updatedSeconds,
          spawnIntervalTicks: Math.max(1, Math.round(updatedSeconds * ticksPerSecond)),
        };
        break;
      }
      case UpgradeMetric.ServiceSpeedMultiplier: {
        result = {
          ...result,
          serviceSpeedMultiplier: Math.max(0.1, combined.serviceSpeedMultiplier * safeMultiplier),
        };
        break;
      }
      case UpgradeMetric.ReputationMultiplier: {
        result = {
          ...result,
          reputationMultiplier: Math.max(0, combined.reputationMultiplier * safeMultiplier),
        };
        break;
      }
      case UpgradeMetric.TreatmentRooms: {
        result = {
          ...result,
          treatmentRooms: Math.max(1, Math.round(combined.treatmentRooms * safeMultiplier)),
        };
        break;
      }
      case UpgradeMetric.WeeklyExpenses: {
        result = {
          ...result,
          weeklyExpenses: Math.max(0, combined.weeklyExpenses * safeMultiplier),
        };
        break;
      }
      case UpgradeMetric.HappyProbability: {
        result = {
          ...result,
          happyProbability: Math.max(0, Math.min(1, combined.happyProbability * safeMultiplier)),
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
