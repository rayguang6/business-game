/**
 * Centralized Effect Validation Utility
 * 
 * Validates effects when fetching from database to ensure only valid JSON is processed.
 * Uses enums (GameMetric, EffectType, EventEffectType) as single source of truth - no hardcoded strings.
 */

import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { EventEffectType } from '@/lib/types/gameEvents';
import type { UpgradeEffect } from '@/lib/game/types';

/**
 * Validates if a value is a valid GameMetric enum value
 * Uses enum values as single source of truth
 */
export function isValidGameMetric(value: unknown): value is GameMetric {
  if (typeof value !== 'string') {
    return false;
  }
  return Object.values(GameMetric).includes(value as GameMetric);
}

/**
 * Validates if a value is a valid EffectType enum value
 * Uses enum values as single source of truth
 */
export function isValidEffectType(value: unknown): value is EffectType {
  if (typeof value !== 'string') {
    return false;
  }
  return Object.values(EffectType).includes(value as EffectType);
}

/**
 * Validates if a value is a valid number (finite and not NaN)
 */
function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Validates a single UpgradeEffect object
 * Used for Staff, Upgrades, and Marketing effects
 * All types come from enums - no hardcoded strings
 */
export function validateUpgradeEffect(effect: unknown): effect is UpgradeEffect {
  if (!effect || typeof effect !== 'object') {
    return false;
  }

  const e = effect as Record<string, unknown>;

  // Required: metric must be valid GameMetric enum value
  if (!isValidGameMetric(e.metric)) {
    return false;
  }

  // Required: type must be valid EffectType enum value
  if (!isValidEffectType(e.type)) {
    return false;
  }

  // Required: value must be a valid number
  if (!isValidNumber(e.value)) {
    return false;
  }

  // Strict validation: reject unknown fields
  const allowedKeys = ['metric', 'type', 'value'];
  const keys = Object.keys(e);
  if (keys.some(key => !allowedKeys.includes(key))) {
    return false;
  }

  return true;
}

/**
 * Validates and parses an array of UpgradeEffect from database JSON
 * Returns only valid effects, filtering out invalid ones
 * All validation uses enums as single source of truth
 */
export function validateAndParseUpgradeEffects(raw: unknown): UpgradeEffect[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(validateUpgradeEffect)
    .map((effect) => {
      const e = effect as unknown as Record<string, unknown>;
      return {
        metric: e.metric as GameMetric,
        type: e.type as EffectType,
        value: e.value as number,
      };
    });
}

/**
 * Validates a CampaignEffect (used for Marketing campaigns)
 * Similar to UpgradeEffect but includes durationMonths
 * All types come from enums - no hardcoded strings
 */
export function validateCampaignEffect(effect: unknown): boolean {
  if (!effect || typeof effect !== 'object') {
    return false;
  }

  const e = effect as Record<string, unknown>;

  // Required: metric must be valid GameMetric enum value
  if (!isValidGameMetric(e.metric)) {
    return false;
  }

  // Required: type must be valid EffectType enum value
  if (!isValidEffectType(e.type)) {
    return false;
  }

  // Required: value must be a valid number
  if (!isValidNumber(e.value)) {
    return false;
  }

  // Optional: durationMonths must be null or a valid number
  if (e.durationMonths !== null && e.durationMonths !== undefined && !isValidNumber(e.durationMonths)) {
    return false;
  }

  // Strict validation: reject unknown fields
  const allowedKeys = ['metric', 'type', 'value', 'durationMonths'];
  const keys = Object.keys(e);
  if (keys.some(key => !allowedKeys.includes(key))) {
    return false;
  }

  return true;
}

/**
 * Validates and parses an array of CampaignEffect from database JSON
 * Returns only valid effects, filtering out invalid ones
 * Includes durationMonths support for marketing campaigns
 */
export function validateAndParseCampaignEffects(raw: unknown): Array<{
  metric: GameMetric;
  type: EffectType;
  value: number;
  durationMonths?: number | null;
}> {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(validateCampaignEffect)
    .map((effect) => {
      const e = effect as Record<string, unknown>;
      return {
        metric: e.metric as GameMetric,
        type: e.type as EffectType,
        value: e.value as number,
        durationMonths: e.durationMonths as number | null | undefined,
      };
    });
}

/**
 * Validates a GameEventEffect (used in events)
 * Events have special types: cash, exp, dynamicCash, metric
 * For 'metric' type, uses enums as single source of truth
 * Metric effects use durationMonths instead of durationSeconds
 */
export function validateGameEventEffect(effect: unknown): boolean {
  if (!effect || typeof effect !== 'object') {
    return false;
  }

  const e = effect as Record<string, unknown>;
  const type = e.type;

  // Use enum values as single source of truth - enum values are strings, so we compare directly
  // cash type
  if (type === EventEffectType.Cash) {
    if (!isValidNumber(e.amount)) {
      return false;
    }
    if (e.label !== undefined && typeof e.label !== 'string') {
      return false;
    }
    // Only allow: type, amount, label
    const allowedKeys = ['type', 'amount', 'label'];
    return Object.keys(e).every(key => allowedKeys.includes(key));
  }

  // exp type (removed legacy 'reputation' and 'skillLevel' support)
  if (type === EventEffectType.Exp) {
    if (!isValidNumber(e.amount)) {
      return false;
    }
    // Only allow: type, amount
    const allowedKeys = ['type', 'amount'];
    return Object.keys(e).every(key => allowedKeys.includes(key));
  }

  // dynamicCash type
  if (type === EventEffectType.DynamicCash) {
    if (typeof e.expression !== 'string' || !e.expression.trim()) {
      return false;
    }
    if (e.label !== undefined && typeof e.label !== 'string') {
      return false;
    }
    // Only allow: type, expression, label
    const allowedKeys = ['type', 'expression', 'label'];
    return Object.keys(e).every(key => allowedKeys.includes(key));
  }

  // metric type - uses enums as single source of truth
  if (type === EventEffectType.Metric) {
    if (!isValidGameMetric(e.metric)) {
      return false;
    }
    if (!isValidEffectType(e.effectType)) {
      return false;
    }
    if (!isValidNumber(e.value)) {
      return false;
    }
    if (e.durationMonths !== null && e.durationMonths !== undefined && !isValidNumber(e.durationMonths)) {
      return false;
    }
    if (e.priority !== undefined && !isValidNumber(e.priority)) {
      return false;
    }
    // Only allow: type, metric, effectType, value, durationMonths, priority
    const allowedKeys = ['type', 'metric', 'effectType', 'value', 'durationMonths', 'priority'];
    return Object.keys(e).every(key => allowedKeys.includes(key));
  }

  // Unknown type - reject
  return false;
}

/**
 * Validates and filters an array of GameEventEffect from database JSON
 * Returns only valid effects, filtering out invalid ones
 * Removes legacy 'reputation' type support
 */
export function validateAndParseGameEventEffects(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(validateGameEventEffect);
}

