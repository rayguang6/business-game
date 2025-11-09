/**
 * Economy Feature
 * Handles all economy-related config and mechanics
 */

import {
  DEFAULT_INDUSTRY_ID,
  getBusinessMetrics,
  getBusinessStats,
  getBaseUpgradeMetricsForIndustry,
  getUpgradesForIndustry,
  UpgradeDefinition,
} from '@/lib/game/config';
import { IndustryId, UpgradeId } from '@/lib/game/types';
import { getUpgradeLevel } from './upgrades';
import { Upgrades } from '@/lib/store/types';
import { EffectType, GameMetric, effectManager } from '@/lib/game/effectManager';
import { Staff } from '@/lib/features/staff';

export interface ExpenseBreakdownItem {
  label: string;
  amount: number;
  category: 'base' | 'upgrade' | 'event' | 'staff'; //TODO: Turn into Global Enum
  sourceId?: string;
}

// Mechanics
/**
 * Returns the baseline monthly operating expenses
 */
export function getMonthlyBaseExpenses(industryId: IndustryId): number {
  return getBusinessMetrics(industryId).monthlyExpenses;
}

function calculateUpgradeExpenseFromDefinition(
  upgrade: UpgradeDefinition,
  industryId: IndustryId,
): number {
  const baseMonthlyExpenses = getMonthlyBaseExpenses(industryId);
  return upgrade.effects
    .filter((effect) => effect.metric === GameMetric.MonthlyExpenses)
    .reduce((total, effect) => {
      if (effect.type === EffectType.Add) {
        return total + effect.value;
      }

      if (effect.type === EffectType.Percent) {
        return total + baseMonthlyExpenses * (effect.value / 100);
      }

      return total;
    }, 0);
}

export function buildMonthlyExpenseBreakdown(
  upgrades: Upgrades,
  monthlyOneTimeCosts: number = 0,
  industryId: IndustryId,
  staffMembers: Staff[] = [],
): ExpenseBreakdownItem[] {
  const availableUpgrades = getUpgradesForIndustry(industryId);
  const upgradeMap = new Map(availableUpgrades.map((upgrade) => [upgrade.id, upgrade]));
  const breakdown: ExpenseBreakdownItem[] = [
    {
      label: 'Base operations',
      amount: getMonthlyBaseExpenses(industryId),
      category: 'base',
    },
  ];

  const totalStaffSalary = staffMembers.reduce((sum, staff) => sum + (staff.salary ?? 0), 0);
  if (totalStaffSalary > 0) {
    breakdown.push({
      label: 'Staff salaries',
      amount: totalStaffSalary,
      category: 'staff',
    });
  }

  Object.entries(upgrades)
    .filter(([_, level]) => level > 0)
    .forEach(([upgradeId, level]) => {
      const upgrade = upgradeMap.get(upgradeId as UpgradeId);
      if (!upgrade) return;
      
      const additionalExpenses = calculateUpgradeExpenseFromDefinition(upgrade, industryId) * level;
      if (additionalExpenses > 0) {
        const label = level > 1 ? `${upgrade.name} (Lvl ${level})` : upgrade.name;
        breakdown.push({
          label,
          amount: additionalExpenses,
          category: 'upgrade',
          sourceId: upgrade.id,
        });
      }
    });

  if (monthlyOneTimeCosts > 0) {
    breakdown.push({
      label: 'One-time costs',
      amount: monthlyOneTimeCosts,
      category: 'event',
    });
  }

  return breakdown;
}

/**
 * Calculates the total monthly expenses contributed by upgrades.
 */
export function calculateUpgradeMonthlyExpenses(
  upgrades: Upgrades,
  industryId: IndustryId,
): number {
  const baseMetrics = getBaseUpgradeMetricsForIndustry(industryId);
  const currentExpenses = effectManager.calculate(GameMetric.MonthlyExpenses, baseMetrics.monthlyExpenses);
  return Math.max(0, currentExpenses - baseMetrics.monthlyExpenses);
}

/**
 * Handles end of month calculations
 * Note: Cash is updated instantly during the month, so we only deduct expenses here
 */
export function endOfMonth(
  currentCash: number,
  monthlyRevenue: number,
  monthlyExpenses: number = 0,
  monthlyOneTimeCosts: number = 0,
  monthlyOneTimeCostsPaid: number = 0,
  industryId: IndustryId,
): { cash: number; profit: number; totalExpenses: number; baseExpenses: number; additionalExpenses: number; oneTimeCosts: number } {
  // monthlyExpenses already contains base expenses, so don't add them again
  // Total expenses = monthlyExpenses (which includes base) + one-time costs
  const totalExpenses = monthlyExpenses + monthlyOneTimeCosts;
  const payableOneTimeCosts = Math.max(0, monthlyOneTimeCosts - monthlyOneTimeCostsPaid);
  
  // Only deduct expenses (cash was already updated during the month)
  const newCash = currentCash - (monthlyExpenses + payableOneTimeCosts);
  
  // Calculate profit for reporting (revenue - expenses)
  const profit = monthlyRevenue - totalExpenses;
  
  // For reporting, separate base from additional expenses
  const baseExpenses = getMonthlyBaseExpenses(industryId);
  const additionalExpenses = Math.max(monthlyExpenses - baseExpenses, 0);
  
  return {
    cash: newCash,
    profit,
    totalExpenses,
    baseExpenses,
    additionalExpenses,
    oneTimeCosts: monthlyOneTimeCosts
  };
}
