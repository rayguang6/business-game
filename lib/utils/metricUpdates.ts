import { effectManager, GameMetric } from '@/lib/game/effectManager';
import { GameStore } from '@/lib/store/gameStore';

/**
 * Updates leveraged time capacity and current time based on active effects
 * This should be called whenever effects that modify LeveragedTime are added or removed
 *
 * @param currentMetrics - Current metrics state
 * @param set - Zustand set function to update the full store state
 */
export function updateLeveragedTimeCapacity(
  currentMetrics: { leveragedTime: number; leveragedTimeCapacity: number },
  set: (partial: GameStore | Partial<GameStore> | ((state: GameStore) => GameStore | Partial<GameStore>), replace?: false | undefined) => void
): void {
  // Calculate new capacity from all effects
  const newLeveragedTimeCapacity = effectManager.calculate(GameMetric.LeveragedTime, 0);
  const currentCapacity = currentMetrics.leveragedTimeCapacity;
  const capacityDelta = newLeveragedTimeCapacity - currentCapacity;

  if (capacityDelta !== 0) {
    set((state) => {
      let newLeveragedTime = state.metrics.leveragedTime;

      if (capacityDelta > 0) {
        // When adding effects: add to both time and capacity
        newLeveragedTime = state.metrics.leveragedTime + capacityDelta;
      } else {
        // When removing effects: decrease both time and capacity
        // Also clamp time to not exceed the new capacity
        newLeveragedTime = Math.min(state.metrics.leveragedTime, newLeveragedTimeCapacity);
      }

      return {
        metrics: {
          ...state.metrics,
          leveragedTime: Math.max(0, newLeveragedTime),
          leveragedTimeCapacity: Math.max(0, newLeveragedTimeCapacity),
        },
      };
    });
  }
}