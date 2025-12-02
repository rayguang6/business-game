import { effectManager, GameMetric, EffectType } from '@/lib/game/effectManager';
import type { UpgradeEffect, Requirement } from '@/lib/game/types';
import type { SourceInfo } from '@/lib/config/sourceTypes';
import { SourceHelpers } from '@/lib/utils/financialTracking';

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
  
  // Movement/positioning state (MEMORY ONLY - not stored in database)
  x?: number; // Current X position (grid coordinates)
  y?: number; // Current Y position (grid coordinates)
  targetX?: number; // Target X position for movement
  targetY?: number; // Target Y position for movement
  path?: import('@/lib/game/types').GridPosition[]; // Current path waypoints
  status?: 'idle' | 'walking_to_room' | 'serving' | 'walking_to_idle'; // Current animation state
  assignedRoomId?: number; // Which room they're currently assigned to (if serving)
  assignedCustomerId?: string; // Which customer they're serving (if serving)
  facingDirection?: 'down' | 'left' | 'up' | 'right'; // Current facing direction
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
  applyExpChange?: (amount: number) => void;
  applyFreedomScoreChange?: (amount: number) => void;
  recordEventRevenue?: (amount: number, labelOrSource?: string | SourceInfo, label?: string) => void;
  recordEventExpense?: (amount: number, labelOrSource: string | SourceInfo, label?: string) => void;
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
         effect.metric === GameMetric.Exp || effect.metric === GameMetric.FreedomScore)
        && effect.type === EffectType.Add && store) {
      // Apply directly to state
      if (effect.metric === GameMetric.Cash) {
        if (store.recordEventRevenue && store.recordEventExpense) {
          const sourceInfo: SourceInfo = SourceHelpers.fromStaff(staff.id, staff.name);
          const label = `Staff: ${staff.name}`;
          if (effect.value >= 0) {
            store.recordEventRevenue(effect.value, sourceInfo, label);
          } else {
            store.recordEventExpense(Math.abs(effect.value), sourceInfo, label);
          }
        } else if (store.applyCashChange) {
          store.applyCashChange(effect.value);
        }
      } else if (effect.metric === GameMetric.Time && store.applyTimeChange) {
        store.applyTimeChange(effect.value);
      } else if (effect.metric === GameMetric.Exp && store.applyExpChange) {
        store.applyExpChange(effect.value);
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
