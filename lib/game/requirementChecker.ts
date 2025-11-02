import type { GameStore } from '@/lib/store/gameStore';
import { evaluateCondition } from './conditionEvaluator';
import type { Requirement } from './types';

/**
 * Evaluates a single requirement with explicit type and expected value
 * @param req - The requirement to check
 * @param store - The current game store state
 * @returns true if the requirement matches the expected value
 */
function evaluateRequirement(req: Requirement, store: GameStore): boolean {
  const { type, id, expected } = req;

  // Default expected to true if not specified (must be met)
  const isExpected = expected !== false;

  let actualValue = false;

  if (type === 'flag') {
    // Flags are stored without prefix in the store
    const flagValue = store.flags?.[id];
    actualValue = flagValue === true;
  } else if (type === 'condition') {
    if (!store.availableConditions || !Array.isArray(store.availableConditions)) {
      console.warn(`[Requirements] availableConditions not initialized`);
      actualValue = false;
    } else {
      // Look for condition by clean ID (without prefix)
      const condition = store.availableConditions.find(c =>
        c.id === id || c.id === `condition_${id}`
      );
      if (!condition) {
        console.warn(`[Requirements] Condition not found: ${id}`);
        actualValue = false;
      } else {
        actualValue = evaluateCondition(condition, store);
      }
    }
  } else {
    console.warn(`[Requirements] Unknown requirement type: ${type}`);
    actualValue = false;
  }

  // Return true if actual value matches expected value
  return actualValue === isExpected;
}

/**
 * Checks if all requirements are met
 * @param requirements - Array of Requirement objects
 * @param store - The current game store state
 * @returns true if all requirements are met, false otherwise
 */
export function checkRequirements(requirements: Requirement[], store: GameStore): boolean {
  return requirements.every(req => evaluateRequirement(req, store));
}

/**
 * Gets a human-readable description of a requirement
 * @param req - The requirement to describe
 * @param store - The current game store state
 * @returns Human-readable description
 */
export function getRequirementDescription(req: Requirement, store: GameStore): string {
  const { type, id, expected } = req;
  const prefix = expected === false ? "NOT " : "";

  if (type === 'flag') {
    // Check availableFlags for human-readable names
    if (store.availableFlags && Array.isArray(store.availableFlags)) {
      const flag = store.availableFlags.find(f => f.id === id || f.id === `flag_${id}`);
      if (flag) {
        return `${prefix}${flag.name}`;
      }
    }
    return `${prefix}${id}`;
  } else if (type === 'condition') {
    // Check availableConditions for human-readable names
    if (store.availableConditions && Array.isArray(store.availableConditions)) {
      const condition = store.availableConditions.find(c => c.id === id || c.id === `condition_${id}`);
      if (condition) {
        return `${prefix}${condition.name}`;
      }
    }
    return `${prefix}Condition: ${id}`;
  }

  return `${prefix}${id}`;
}
