import { effectManager, GameMetric } from '@/lib/game/effectManager';

/**
 * Updates leveraged time capacity and current time based on active effects
 * This should be called whenever effects that modify LeveragedTime are added or removed
 *
 * @param currentMetrics - Current metrics state
 * @param setMetrics - Function to update metrics state
 */
export function updateLeveragedTimeCapacity(
  currentMetrics: { leveragedTime: number; leveragedTimeCapacity: number },
  setMetrics: (updater: (state: Record<string, unknown>) => Record<string, unknown>) => void
): void {
  // Calculate new capacity from all effects
  const newLeveragedTimeCapacity = effectManager.calculate(GameMetric.LeveragedTime, 0);
  const currentCapacity = currentMetrics.leveragedTimeCapacity;
  const capacityDelta = newLeveragedTimeCapacity - currentCapacity;

  if (capacityDelta !== 0) {
    setMetrics((state) => {
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