/**
 * Centralized Effect Management System
 * 
 * This system handles all stat modifications from:
 * - Upgrades (permanent)
 * - Marketing campaigns (temporary)
 * - Staff (dynamic based on hired staff)
 * - Events (one-time or temporary)
 * 
 * Formula: (base + adds) × (1 + percents/100) × multiplies, then Set overrides
 * Order: Add → Percent → Multiply → Set
 */

import { IndustryId } from './types';
import { getTicksPerSecondForIndustry } from './config';

// All game metrics that can be affected by effects
export enum GameMetric {
  Cash = 'cash', // Direct cash modification (add/subtract)
  Time = 'time', // Direct time modification (add/subtract)
  SpawnIntervalSeconds = 'spawnIntervalSeconds',
  ServiceSpeedMultiplier = 'serviceSpeedMultiplier',
  ServiceRooms = 'serviceRooms',
  SkillLevel = 'skillLevel', // Direct skill level modification (add/subtract)
  // HappyProbability removed - not used in game mechanics (customers happy/angry based on patience)
  MonthlyExpenses = 'monthlyExpenses',
  ServiceRevenueMultiplier = 'serviceRevenueMultiplier',
  ServiceRevenueFlatBonus = 'serviceRevenueFlatBonus',
  FreedomScore = 'freedomScore', // Previously: FounderWorkingHours
  SpawnCustomers = 'spawnCustomers', // Immediate customer spawning (one-time action)
  // Tier-specific service metrics
  HighTierServiceRevenueMultiplier = 'highTierServiceRevenueMultiplier',
  HighTierServiceWeightageMultiplier = 'highTierServiceWeightageMultiplier',
  MidTierServiceRevenueMultiplier = 'midTierServiceRevenueMultiplier',
  MidTierServiceWeightageMultiplier = 'midTierServiceWeightageMultiplier',
  LowTierServiceRevenueMultiplier = 'lowTierServiceRevenueMultiplier',
  LowTierServiceWeightageMultiplier = 'lowTierServiceWeightageMultiplier',
}

// How effects are applied
export enum EffectType {
  Add = 'add',           // Flat addition: value + effect
  Percent = 'percent',   // Percentage: value × (1 + effect/100)
  Multiply = 'multiply', // Multiplication: value × effect
  Set = 'set',          // Override: value = effect
}

// Who created this effect (for debugging and removal)
export interface EffectSource {
  category: 'upgrade' | 'marketing' | 'staff' | 'event';
  id: string;      // e.g., "extra_treatment_room" or "staff_123"
  name: string;    // e.g., "Extra Treatment Room" (for UI)
}

// Individual effect
export interface Effect {
  id: string;              // Unique ID for this effect instance
  source: EffectSource;    // What created this effect
  metric: GameMetric;      // What stat it affects
  type: EffectType;        // How it's applied
  value: number;           // The magnitude (20 = +20% for Percent type)
  priority?: number;       // Optional ordering within same type
  durationSeconds?: number | null; // null = permanent, number = expires after seconds
  createdAt: number;       // When effect was added (for expiration calculation)
}

// Input for creating new effects (without createdAt, but can optionally provide it)
export interface EffectInput extends Omit<Effect, 'createdAt'> {
  createdAt?: number; // Optional: if provided, use this instead of current game time
}

// Constraints for each metric (optional - only add when needed)
export interface MetricConstraints {
  min?: number;
  max?: number;
  roundToInt?: boolean;
}

// Constraints definition (optional - metrics without constraints will work fine)
export const METRIC_CONSTRAINTS: Partial<Record<GameMetric, MetricConstraints>> = {
  // Only add constraints where they're actually needed
  [GameMetric.Cash]: {
    min: 0,           // Can't have negative cash (game over condition)
    roundToInt: true, // Must be whole number
  },
  [GameMetric.Time]: {
    min: 0,           // Can't have negative time (game over condition)
    roundToInt: true, // Must be whole number
  },
  [GameMetric.ServiceRooms]: { 
    min: 1,           // Can't have negative rooms
    // max removed - capacity handled by upgrades
    roundToInt: true, // Must be whole number
  },
  // [GameMetric.HappyProbability] removed - not used in game mechanics
  [GameMetric.FreedomScore]: {
    min: 0,           // Can't have negative hours
    roundToInt: true, // Must be whole number
  },
  [GameMetric.SkillLevel]: {
    min: 0,           // Can't have negative skill level
    roundToInt: true, // Must be whole number
  },
  // Add more constraints here only when needed
  // Metrics without constraints will work fine (no validation)
};

// Result of a metric calculation with audit trail
export interface MetricCalculation {
  metric: GameMetric;
  baseValue: number;
  finalValue: number;
  steps: CalculationStep[];
  contributors: EffectSource[];
}

export interface CalculationStep {
  description: string;
  value: number;
  delta?: number;
  effect?: Effect;
}

export type MetricValues = Record<GameMetric, number>;

// Sort effects by priority (if set), otherwise keep original order
// Note: For Add/Percent/Multiply, order doesn't matter mathematically
// This is mainly useful for Set effects where we want the highest priority one
const sortEffectsByPriority = (effects: Effect[]): Effect[] => {
  // If no effects have priority set, return as-is (order doesn't matter)
  const hasPriority = effects.some(e => e.priority !== undefined && e.priority !== null);
  if (!hasPriority) {
    return effects;
  }
  // Sort by priority (higher priority first), then by original order
  return effects.slice().sort((a, b) => {
    const aPriority = a.priority ?? 0;
    const bPriority = b.priority ?? 0;
    return bPriority - aPriority;
  });
};

const partitionEffectsByType = (
  effects: Effect[],
): Record<EffectType, Effect[]> => {
  const buckets: Record<EffectType, Effect[]> = {
    [EffectType.Add]: [],
    [EffectType.Percent]: [],
    [EffectType.Multiply]: [],
    [EffectType.Set]: [],
  };

  effects.forEach((effect) => {
    buckets[effect.type].push(effect);
  });

  return buckets;
};

const applyConstraints = (value: number, metric: GameMetric): number => {
  const constraints = METRIC_CONSTRAINTS[metric];
  
  // If no constraints defined, return value as-is (completely optional)
  if (!constraints) {
    return value;
  }
  
  let result = value;

  // Apply min constraint if defined
  if (constraints.min !== undefined) {
    result = Math.max(constraints.min, result);
  }
  
  // Apply max constraint if defined
  if (constraints.max !== undefined) {
    result = Math.min(constraints.max, result);
  }

  // Round to integer if needed (e.g., for ServiceRooms, FreedomScore)
  if (constraints.roundToInt) {
    result = Math.round(result);
  }

  return result;
};

export function calculateMetricValue(
  metric: GameMetric,
  baseValue: number,
  effects: Effect[],
): number {
  if (effects.length === 0) {
    return applyConstraints(baseValue, metric);
  }

  const byType = partitionEffectsByType(effects);

  let value = baseValue;

  if (byType[EffectType.Add].length > 0) {
    sortEffectsByPriority(byType[EffectType.Add]).forEach((effect) => {
      value += effect.value;
    });
  }

  if (byType[EffectType.Percent].length > 0) {
    const percentTotal = byType[EffectType.Percent].reduce(
      (sum, effect) => sum + effect.value,
      0,
    );
    if (metric === GameMetric.SpawnIntervalSeconds) {
      const divisor = Math.max(0.01, 1 + percentTotal / 100);
      value /= divisor;
    } else {
      value *= 1 + percentTotal / 100;
    }
  }

  if (byType[EffectType.Multiply].length > 0) {
    sortEffectsByPriority(byType[EffectType.Multiply]).forEach((effect) => {
      if (metric === GameMetric.SpawnIntervalSeconds) {
        value /= Math.max(0.01, Math.abs(effect.value));
      } else {
        value *= effect.value;
      }
    });
  }

  if (byType[EffectType.Set].length > 0) {
    const [highestPriority] = sortEffectsByPriority(byType[EffectType.Set]);
    value = highestPriority.value;
  }

  return applyConstraints(value, metric);
}

export function applyEffectsToMetrics(
  baseValues: MetricValues,
  effects: Effect[],
): MetricValues {
  if (effects.length === 0) {
    return { ...baseValues };
  }

  const grouped = new Map<GameMetric, Effect[]>();
  effects.forEach((effect) => {
    const existing = grouped.get(effect.metric);
    if (existing) {
      existing.push(effect);
    } else {
      grouped.set(effect.metric, [effect]);
    }
  });

  const result: Partial<MetricValues> = {};

  (Object.keys(baseValues) as GameMetric[]).forEach((metric) => {
    const metricEffects = grouped.get(metric) ?? [];
    result[metric] = calculateMetricValue(metric, baseValues[metric], metricEffects);
  });

  return result as MetricValues;
}

/**
 * Effect Manager - Singleton for managing all game effects
 */
class EffectManager {
  private effects: Map<string, Effect> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Add a new effect to the system
   * @param effect The effect to add
   * @param currentGameTime Optional: current game time in seconds. If not provided, will use Date.now() / 1000 (real-world time)
   */
  add(effect: EffectInput, currentGameTime?: number): void {
    const effectWithTimestamp: Effect = {
      ...effect,
      createdAt: effect.createdAt ?? (currentGameTime ?? Date.now() / 1000),
    };
    this.effects.set(effect.id, effectWithTimestamp);
    this.notifyListeners();
  }

  /**
   * Remove an effect by its ID
   */
  remove(id: string): void {
    this.effects.delete(id);
    this.notifyListeners();
  }

  /**
   * Remove all effects from a specific source
   * e.g., removeBySource('marketing', 'neighborhood-flyers')
   */
  removeBySource(category: string, sourceId: string): void {
    const toDelete: string[] = [];
    for (const [id, effect] of Array.from(this.effects.entries())) {
      if (effect.source.category === category && effect.source.id === sourceId) {
        toDelete.push(id);
      }
    }
    toDelete.forEach(id => this.effects.delete(id));
    this.notifyListeners();
  }

  /**
   * Remove all effects from a category
   * e.g., clearCategory('marketing') removes all marketing effects
   */
  clearCategory(category: string): void {
    const toDelete: string[] = [];
    for (const [id, effect] of Array.from(this.effects.entries())) {
      if (effect.source.category === category) {
        toDelete.push(id);
      }
    }
    toDelete.forEach(id => this.effects.delete(id));
    this.notifyListeners();
  }

  /**
   * Clear all effects (useful for game reset)
   */
  clearAll(): void {
    this.effects.clear();
    this.notifyListeners();
  }

  /**
   * Get all effects affecting a specific metric
   */
  getEffectsForMetric(metric: GameMetric): Effect[] {
    return Array.from(this.effects.values())
      .filter(e => e.metric === metric);
  }

  /**
   * Calculate the final value of a metric with all effects applied
   * 
   * Order: Add → Percent → Multiply → Set
   * Formula: (base + adds) × (1 + percents/100) × multiplies, then Set overrides
   */
  calculate(metric: GameMetric, baseValue: number): number {
    const applicable = this.getEffectsForMetric(metric);
    return calculateMetricValue(metric, baseValue, applicable);
  }

  /**
   * Calculate with full audit trail (for debugging/UI)
   */
  calculateDetailed(metric: GameMetric, baseValue: number): MetricCalculation {
    const applicable = this.getEffectsForMetric(metric);
    const byType = partitionEffectsByType(applicable);
    const steps: CalculationStep[] = [{ description: 'Base', value: baseValue }];

    let value = baseValue;

    const addEffects = sortEffectsByPriority(byType[EffectType.Add]);
    addEffects.forEach((effect) => {
      const before = value;
      value += effect.value;
      steps.push({
        description: `${effect.source.name} (+${effect.value})`,
        value,
        delta: value - before,
        effect,
      });
    });

    const percentEffects = sortEffectsByPriority(byType[EffectType.Percent]);
    if (percentEffects.length > 0) {
      const baseForPercent = value;
      let accumulatedPercent = 0;
      percentEffects.forEach((effect) => {
        const before = value;
        accumulatedPercent += effect.value;
        value = baseForPercent * (1 + accumulatedPercent / 100);
        steps.push({
          description: `${effect.source.name} (${effect.value >= 0 ? '+' : ''}${effect.value}%)`,
          value,
          delta: value - before,
          effect,
        });
      });
    }

    const multiplyEffects = sortEffectsByPriority(byType[EffectType.Multiply]);
    multiplyEffects.forEach((effect) => {
      const before = value;
      value *= effect.value;
      steps.push({
        description: `${effect.source.name} (×${effect.value})`,
        value,
        delta: value - before,
        effect,
      });
    });

    const setEffects = sortEffectsByPriority(byType[EffectType.Set]);
    if (setEffects.length > 0) {
      const before = value;
      const highestPriority = setEffects[0];
      value = highestPriority.value;
      steps.push({
        description: `${highestPriority.source.name} (set)`,
        value,
        delta: value - before,
        effect: highestPriority,
      });
    }

    const constrainedValue = applyConstraints(value, metric);
    if (constrainedValue !== value) {
      steps.push({
        description: 'Constraints applied',
        value: constrainedValue,
        delta: constrainedValue - value,
      });
    }

    return {
      metric,
      baseValue,
      finalValue: constrainedValue,
      steps,
      contributors: [
        ...addEffects,
        ...percentEffects,
        ...multiplyEffects,
        ...setEffects,
      ].map(e => e.source),
    };
  }

  /**
   * Get a breakdown for UI display
   */
  getMetricBreakdown(metric: GameMetric): {
    effects: Effect[];
    byType: Record<EffectType, Effect[]>;
  } {
    const effects = this.getEffectsForMetric(metric);
    const byType: Record<EffectType, Effect[]> = {
      [EffectType.Add]: [],
      [EffectType.Percent]: [],
      [EffectType.Multiply]: [],
      [EffectType.Set]: [],
    };

    for (const effect of effects) {
      byType[effect.type].push(effect);
    }

    return { effects, byType };
  }

  /**
   * Subscribe to effect changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get all active effects (for debugging)
   */
  getAllEffects(): Effect[] {
    return Array.from(this.effects.values());
  }

  /**
   * Check if an effect has expired
   */
  private isEffectExpired(effect: Effect, currentTime: number): boolean {
    if (effect.durationSeconds === null || effect.durationSeconds === undefined) {
      return false; // Permanent effect
    }
    return currentTime >= effect.createdAt + effect.durationSeconds;
  }

  /**
   * Tick the effect manager - remove expired effects
   * Call this from the game loop with current game time
   */
  tick(currentTime: number): void {
    const toRemove: string[] = [];
    for (const [id, effect] of this.effects.entries()) {
      if (this.isEffectExpired(effect, currentTime)) {
        toRemove.push(id);
      }
    }

    if (toRemove.length > 0) {
      toRemove.forEach(id => this.effects.delete(id));
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Singleton instance
export const effectManager = new EffectManager();

/**
 * Helper function to calculate metrics with industry-specific adjustments
 * (like converting spawn seconds to ticks)
 */
export function calculateMetricWithIndustry(
  metric: GameMetric,
  baseValue: number,
  industryId: IndustryId,
): { value: number; ticks?: number } {
  const value = effectManager.calculate(metric, baseValue);

  // Special handling for spawn interval - also return as ticks
  if (metric === GameMetric.SpawnIntervalSeconds) {
    const ticksPerSecond = getTicksPerSecondForIndustry(industryId);
    const ticks = Math.max(1, Math.round(value * ticksPerSecond));
    return { value, ticks };
  }

  return { value };
}
