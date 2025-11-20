import { effectManager, GameMetric, EffectType } from '@/lib/game/effectManager';
import type { UpgradeEffect, Requirement } from '@/lib/game/types';

export interface Staff {
  id: string;
  name: string;
  salary: number;
  effects: UpgradeEffect[]; // Flexible effects array like upgrades
  role: string;
  roleId: string; // Reference to the role configuration
  spriteImage?: string; // Optional sprite image path (from role, falls back to default if not set)
  setsFlag?: string; // Optional flag to set when this staff member is hired
  requirements?: Requirement[]; // Array of requirements (all must be met = AND logic)
}

/**
 * Severance payment multiplier
 * When firing staff, player pays: monthlySalary × SEVERANCE_MULTIPLIER
 * Can be adjusted for balancing (e.g., 1x, 2x, 3x)
 */
export const SEVERANCE_MULTIPLIER = 1.0;

/**
 * Calculate severance payment cost for firing a staff member
 */
export function calculateSeveranceCost(staff: Staff): number {
  return Math.round(staff.salary * SEVERANCE_MULTIPLIER);
}

/**
 * Add a staff member's effects to the effect manager
 * This should be called when a staff member is hired
 */
export function addStaffEffects(staff: Staff, store?: {
  applyCashChange?: (amount: number) => void;
  applyTimeChange?: (amount: number) => void;
  applySkillLevelChange?: (amount: number) => void;
  applyFreedomScoreChange?: (amount: number) => void;
  recordEventRevenue?: (amount: number, label?: string) => void;
  recordEventExpense?: (amount: number, label: string) => void;
}): void {
  // Monthly salary expense (always applied)
  if (staff.salary > 0) {
    effectManager.add({
      id: `staff_${staff.id}_salary`,
      source: {
        category: 'staff',
        id: staff.id,
        name: staff.name,
      },
      metric: GameMetric.MonthlyExpenses,
      type: EffectType.Add,
      value: staff.salary,
    });
  }

  // Apply all staff effects (flexible system like upgrades)
  staff.effects.forEach((effect, index) => {
    // Direct state metrics (Cash, Time, SkillLevel, FreedomScore) are applied directly
    // Other metrics go through effectManager
    if ((effect.metric === GameMetric.Cash || effect.metric === GameMetric.Time || 
         effect.metric === GameMetric.SkillLevel || effect.metric === GameMetric.FreedomScore)
        && effect.type === EffectType.Add && store) {
      // Apply directly to state
      if (effect.metric === GameMetric.Cash) {
        if (store.recordEventRevenue && store.recordEventExpense) {
          if (effect.value >= 0) {
            store.recordEventRevenue(effect.value, `Staff: ${staff.name}`);
          } else {
            store.recordEventExpense(Math.abs(effect.value), `Staff: ${staff.name}`);
          }
        } else if (store.applyCashChange) {
          store.applyCashChange(effect.value);
        }
      } else if (effect.metric === GameMetric.Time && store.applyTimeChange) {
        store.applyTimeChange(effect.value);
      } else if (effect.metric === GameMetric.SkillLevel && store.applySkillLevelChange) {
        store.applySkillLevelChange(effect.value);
      } else if (effect.metric === GameMetric.FreedomScore && store.applyFreedomScoreChange) {
        store.applyFreedomScoreChange(effect.value);
      }
      // Direct state metrics are always permanent (one-time add/subtract)
      // Don't add to effectManager for direct state metrics with Add effects
      return;
    }
    
    effectManager.add({
      id: `staff_${staff.id}_${index}`,
      source: {
        category: 'staff',
        id: staff.id,
        name: staff.name,
      },
      metric: effect.metric,
      type: effect.type,
      value: effect.value,
    });
  });
}

/**
 * Remove a staff member's effects from the effect manager
 * This should be called when a staff member is fired/removed
 */
export function removeStaffEffects(staffId: string): void {
  effectManager.removeBySource('staff', staffId);
}
