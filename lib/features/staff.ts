import { effectManager, GameMetric, EffectType } from '@/lib/game/effectManager';

export interface Staff {
  id: string;
  name: string;
  salary: number;
  increaseServiceSpeed: number; // Percentage: 10 = 10% speed boost (1.1x faster service)
  emoji: string; // To represent the staff member
  role: string;
}

/**
 * Add a staff member's effects to the effect manager
 * This should be called when a staff member is hired
 */
export function addStaffEffects(staff: Staff): void {
  // Service speed boost (stored as percentage)
  // e.g., 10 = +10% speed boost, which means duration ÷ 1.10
  if (staff.increaseServiceSpeed > 0) {
    effectManager.add({
      id: `staff_${staff.id}_speed`,
      source: {
        category: 'staff',
        id: staff.id,
        name: staff.name,
      },
      metric: GameMetric.ServiceSpeedMultiplier,
      type: EffectType.Percent,
      value: staff.increaseServiceSpeed,
    });
  }

  // Monthly salary expense
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
}

/**
 * Remove a staff member's effects from the effect manager
 * This should be called when a staff member is fired/removed
 */
export function removeStaffEffects(staffId: string): void {
  effectManager.removeBySource('staff', staffId);
}
