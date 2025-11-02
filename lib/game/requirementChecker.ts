import type { GameStore } from '@/lib/store/gameStore';
import { evaluateCondition } from './conditionEvaluator';

/**
 * Validates if a requirement ID is properly formatted
 * @param reqId - The requirement ID to validate
 * @returns Object with type and cleanId, or null if invalid
 */
export function validateRequirementId(reqId: string): { type: 'flag' | 'condition', cleanId: string } | null {
  if (reqId.startsWith('flag_')) {
    return { type: 'flag', cleanId: reqId.substring(5) };
  }
  if (reqId.startsWith('condition_')) {
    return { type: 'condition', cleanId: reqId.substring(10) };
  }
  return null; // Invalid ID
}

/**
 * Checks if all requirements are met for a given list of requirement IDs
 * @param requirementIds - Array of requirement IDs (prefixed with 'flag_' or 'condition_')
 * @param store - The current game store state
 * @returns true if all requirements are met, false otherwise
 */
export function checkRequirements(requirementIds: string[], store: GameStore): boolean {
  return requirementIds.every(reqId => {
    const validation = validateRequirementId(reqId);
    if (!validation) {
      console.warn(`[Requirements] Invalid requirement ID: ${reqId}`);
      return false;
    }

    const { type, cleanId } = validation;

    if (type === 'flag') {
      return store.flags[cleanId] === true;
    } else if (type === 'condition') {
      const condition = store.availableConditions.find(c => c.id === cleanId);
      if (!condition) {
        console.warn(`[Requirements] Condition not found: ${cleanId}`);
        return false;
      }
      return evaluateCondition(condition, store);
    }

    return false;
  });
}

/**
 * Gets a human-readable description of a requirement
 * @param reqId - The requirement ID
 * @param store - The current game store state
 * @returns Human-readable description or the ID if not found
 */
export function getRequirementDescription(reqId: string, store: GameStore): string {
  const validation = validateRequirementId(reqId);
  if (!validation) return reqId;

  const { type, cleanId } = validation;

  if (type === 'flag') {
    const flag = store.availableFlags.find(f => f.id === cleanId);
    return flag ? `${flag.name} (Flag)` : `Flag: ${cleanId}`;
  } else if (type === 'condition') {
    const condition = store.availableConditions.find(c => c.id === cleanId);
    return condition ? `${condition.name} (Condition)` : `Condition: ${cleanId}`;
  }

  return reqId;
}
