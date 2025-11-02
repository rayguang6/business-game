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
      // Flags are stored without prefix (normalized in setFlag)
      // cleanId is the flag ID without the 'flag_' prefix
      const flagValue = store.flags?.[cleanId];
      return flagValue === true;
    } else if (type === 'condition') {
      if (!store.availableConditions || !Array.isArray(store.availableConditions)) {
        console.warn(`[Requirements] availableConditions not initialized`);
        return false;
      }
      // Condition IDs can be stored with or without prefix, so check both
      const condition = store.availableConditions.find(c => 
        c.id === cleanId || c.id === reqId || c.id === `condition_${cleanId}`
      );
      if (!condition) {
        console.warn(`[Requirements] Condition not found: ${cleanId} (searched in ${store.availableConditions.length} conditions)`);
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
    // Check availableFlags for human-readable names
    if (store.availableFlags && Array.isArray(store.availableFlags)) {
      const flag = store.availableFlags.find(f =>
        f.id === cleanId || f.id === reqId || f.id === `flag_${cleanId}`
      );
      if (flag) {
        return flag.name;
      }
    }
    // Fallback to clean ID if flag name not found
    return cleanId;
  } else if (type === 'condition') {
    // Safely check availableConditions
    if (!store.availableConditions || !Array.isArray(store.availableConditions)) {
      return `Condition: ${cleanId}`;
    }
    // Condition IDs can be stored with or without prefix, so check both
    const condition = store.availableConditions.find(c =>
      c.id === cleanId || c.id === reqId || c.id === `condition_${cleanId}`
    );
    return condition ? condition.name : `Condition: ${cleanId}`;
  }

  return reqId;
}
