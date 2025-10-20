import { UpgradeEffects } from '@/lib/features/upgrades';
import { IndustryId } from '@/lib/game/types';
import { getTicksPerSecondForIndustry } from '@/lib/game/config';
import { UpgradeEffect, UpgradeMetric } from '@/lib/game/config';

export interface StaffEffectModifiers {
  serviceSpeedMultiplier?: number;
  reputationMultiplier?: number;
}

export interface EffectSources {
  upgrades: UpgradeEffects;
  marketing?: UpgradeEffect[];
  staff?: StaffEffectModifiers;
}

const clampMultiplier = (value: number | undefined, fallback: number = 1): number => {
  if (value === undefined || Number.isNaN(value)) {
    return fallback;
  }
  return value;
};

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
    switch (effect.metric as UpgradeMetric) {
      case 'spawnIntervalSeconds': {
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
      case 'serviceSpeedMultiplier': {
        const updated = Math.max(0.1, applyUpgradeEffectMetric(result.serviceSpeedMultiplier, effect));
        result = { ...result, serviceSpeedMultiplier: updated };
        break;
      }
      case 'reputationMultiplier': {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.reputationMultiplier, effect));
        result = { ...result, reputationMultiplier: updated };
        break;
      }
      case 'treatmentRooms': {
        const updated = applyUpgradeEffectMetric(result.treatmentRooms, effect);
        result = { ...result, treatmentRooms: Math.max(1, Math.round(updated)) };
        break;
      }
      case 'weeklyExpenses': {
        const updated = Math.max(0, applyUpgradeEffectMetric(result.weeklyExpenses, effect));
        result = { ...result, weeklyExpenses: updated };
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
  let combined: UpgradeEffects = { ...sources.upgrades };

  if (sources.marketing && sources.marketing.length > 0) {
    combined = applyUpgradeEffectsToCombined(combined, sources.marketing, industryId);
  }

  if (sources.staff) {
    const serviceSpeedMultiplier = Math.max(0.1, clampMultiplier(sources.staff.serviceSpeedMultiplier));
    const reputationMultiplier = Math.max(0, clampMultiplier(sources.staff.reputationMultiplier));

    combined = {
      ...combined,
      serviceSpeedMultiplier: combined.serviceSpeedMultiplier * serviceSpeedMultiplier,
      reputationMultiplier: combined.reputationMultiplier * reputationMultiplier,
    };
  }

  return combined;
}
