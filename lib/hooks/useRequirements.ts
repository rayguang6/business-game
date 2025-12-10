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
  // Use shallow equality for objects/arrays to prevent unnecessary re-renders
  const flags = useGameStore((state) => state.flags);
  const availableConditions = useGameStore((state) => state.availableConditions);
  const availableFlags = useGameStore((state) => state.availableFlags);
  
  // Subscribe to primitive values that requirements might check (not entire objects)
  const hiredStaffLength = useGameStore((state) => state.hiredStaff.length);
  const upgradesKeys = useGameStore((state) => Object.keys(state.upgrades).sort().join(','));
  const cash = useGameStore((state) => state.metrics.cash);
  const exp = useGameStore((state) => state.metrics.exp);
  const totalExpenses = useGameStore((state) => state.metrics.totalExpenses);
  const gameTime = useGameStore((state) => state.gameTime);
  const selectedIndustryId = useGameStore((state) => state.selectedIndustry?.id);

  return useMemo(() => {
    if (!requirements || requirements.length === 0) {
      return {
        availability: 'available' as const,
        areMet: true,
        descriptions: [],
        unmetDescriptions: [],
      };
    }

    // Get the store snapshot without subscribing to avoid infinite loops
    // We're already subscribed to the specific parts that trigger requirement checks above
    const storeInstance = useGameStore.getState();

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
  }, [requirements, flags, availableConditions, availableFlags, hiredStaffLength, upgradesKeys, cash, exp, totalExpenses, gameTime, selectedIndustryId]);
}

