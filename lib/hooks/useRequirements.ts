import { useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { checkRequirements, getRequirementDescription } from '@/lib/game/requirementChecker';
import type { Requirement } from '@/lib/game/types';

/**
 * Hook to check if requirements are met and get descriptions
 * @param requirements - Array of requirements to check
 * @returns Object with requirements met status and descriptions
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
        areMet: true,
        descriptions: [],
        unmetDescriptions: [],
      };
    }

    const areMet = checkRequirements(requirements, store);
    const descriptions = requirements.map((req) => getRequirementDescription(req, store));

    return {
      areMet,
      descriptions,
      unmetDescriptions: areMet ? [] : descriptions, // If not met, all are considered unmet for UI display
    };
  }, [requirements, flags, availableConditions, availableFlags, store]);
}

