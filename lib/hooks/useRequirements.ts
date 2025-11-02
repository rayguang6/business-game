import { useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { checkRequirements, getRequirementDescription } from '@/lib/game/requirementChecker';

/**
 * Hook to check if requirements are met and get descriptions
 * @param requirementIds - Array of requirement IDs to check
 * @returns Object with requirements met status and descriptions
 */
export function useRequirements(requirementIds?: string[]) {
  // Subscribe to specific parts of the store that affect requirements
  const flags = useGameStore((state) => state.flags);
  const availableConditions = useGameStore((state) => state.availableConditions);
  const availableFlags = useGameStore((state) => state.availableFlags);

  // Get the full store for the checker functions
  const store = useGameStore();

  return useMemo(() => {
    if (!requirementIds || requirementIds.length === 0) {
      return {
        areMet: true,
        descriptions: [],
        unmetDescriptions: [],
      };
    }

    const areMet = checkRequirements(requirementIds, store);
    const descriptions = requirementIds.map((id) => getRequirementDescription(id, store));

    return {
      areMet,
      descriptions,
      unmetDescriptions: areMet ? [] : descriptions, // If not met, all are considered unmet for UI display
    };
  }, [requirementIds, flags, availableConditions, availableFlags, store]);
}

