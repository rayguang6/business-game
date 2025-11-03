import { effectManager, GameMetric, EffectType } from '@/lib/game/effectManager';
import type { UpgradeEffect, Requirement } from '@/lib/game/types';

export interface Staff {
  id: string;
  name: string;
  salary: number;
  effects: UpgradeEffect[]; // Flexible effects array like upgrades
  emoji: string; // To represent the staff member
  role: string;
  roleId: string; // Reference to the role configuration
  spriteImage?: string; // Optional sprite image path (from role, falls back to default if not set)
  setsFlag?: string; // Optional flag to set when this staff member is hired
  requirements?: Requirement[]; // Array of requirements (all must be met = AND logic)
}

/**
 * Add a staff member's effects to the effect manager
 * This should be called when a staff member is hired
 */
export function addStaffEffects(staff: Staff): void {
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
      priority: effect.priority,
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
