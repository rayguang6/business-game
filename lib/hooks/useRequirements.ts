import { useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { checkRequirements, getRequirementDescription, evaluateRequirement } from '@/lib/game/requirementChecker';
import type { Requirement } from '@/lib/game/types';

/**
 * Hook to check requirements and compute availability state
 * @param requirements - Array of requirements to check
 * @returns Object with availability state, requirements status, and descriptions
 */
export function useRequirements(requirements?: Requirement[]) {
  // Subscribe to specific parts of the store that affect requirements
  const flags = useGameStore((state) => state.flags);
  const availableConditions = useGameStore((state) => state.availableConditions);
  const availableFlags = useGameStore((state) => state.availableFlags);

  // Get the full store for the checker functions
  const store = useGameStore();

  return useMemo(() => {
    if (!requirements || requirements.length === 0) {
      return {
        availability: 'available' as const,
        areMet: true,
        descriptions: [],
        unmetDescriptions: [],
      };
    }

    const storeInstance = store;

    // Check each requirement individually to determine availability
    let hasHiddenRequirement = false;
    let hasUnmetRequirement = false;

    const descriptions = requirements.map((req) => getRequirementDescription(req, storeInstance));

    for (const req of requirements) {
      const isMet = evaluateRequirement(req, storeInstance);

      if (!isMet) {
        // Check if this unmet requirement should hide the element
        if (req.onFail === 'hide') {
          hasHiddenRequirement = true;
        }
        hasUnmetRequirement = true;
      }
    }

    // Determine availability state
    let availability: 'hidden' | 'locked' | 'available';
    if (hasHiddenRequirement) {
      availability = 'hidden';
    } else if (hasUnmetRequirement) {
      availability = 'locked';
    } else {
      availability = 'available';
    }

    const areMet = !hasUnmetRequirement;

    return {
      availability,
      areMet,
      descriptions,
      unmetDescriptions: areMet ? [] : descriptions,
    };
  }, [requirements, flags, availableConditions, availableFlags, store]);
}

