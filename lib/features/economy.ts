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
import { Upgrades, ExpenseBreakdownItem } from '@/lib/store/types';
import { EffectType, GameMetric, effectManager } from '@/lib/game/effectManager';
import { Staff } from '@/lib/features/staff';
import { SourceType } from '@/lib/config/sourceTypes';

// Mechanics
/**
 * Returns the baseline monthly operating expenses
 */
export function getMonthlyBaseExpenses(industryId: IndustryId): number {
  const metrics = getBusinessMetrics(industryId);
  if (!metrics) throw new Error('Business metrics not loaded');
  return metrics.monthlyExpenses;
}

function calculateUpgradeExpenseFromDefinition(
  upgrade: UpgradeDefinition,
  industryId: IndustryId,
): number {
  const baseMonthlyExpenses = getMonthlyBaseExpenses(industryId);
  // Sum expenses from all levels
  return upgrade.levels.reduce((total, level) => {
    const levelExpense = level.effects
      .filter((effect) => effect.metric === GameMetric.MonthlyExpenses)
      .reduce((levelTotal, effect) => {
        if (effect.type === EffectType.Add) {
          return levelTotal + effect.value;
        }

        if (effect.type === EffectType.Percent) {
          return levelTotal + baseMonthlyExpenses * (effect.value / 100);
        }
        return levelTotal;
      }, 0);
    return total + levelExpense;
  }, 0);
}

export function buildMonthlyExpenseBreakdown(
  upgrades: Upgrades,
  industryId: IndustryId,
  staffMembers: Staff[] = [],
  gameTime?: number,
): ExpenseBreakdownItem[] {
  const availableUpgrades = getUpgradesForIndustry(industryId);
  const upgradeMap = new Map(availableUpgrades.map((upgrade) => [upgrade.id, upgrade]));
  const breakdown: ExpenseBreakdownItem[] = [
    {
      label: 'Rental',
      amount: getMonthlyBaseExpenses(industryId),
      category: 'base',
      sourceType: SourceType.Base, // SourceType.Base as string
      sourceName: 'Rental',
    },
  ];

  // Add each staff member's salary individually (not combined)
  staffMembers.forEach((staff) => {
    if (staff.salary > 0) {
      breakdown.push({
        label: `Salary: ${staff.name}`,
        amount: staff.salary,
        category: 'staff',
        sourceId: staff.id,
      });
    }
  });

  // Add each upgrade's monthly expense individually
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
          sourceType: SourceType.Upgrade, // SourceType.Upgrade as string
          sourceName: upgrade.name,
        });
      }
    });

  // Add event-based monthly expense changes (from effectManager)
  // Get all active effects that modify MonthlyExpenses
  const monthlyExpenseEffects = effectManager.getEffectsForMetric(GameMetric.MonthlyExpenses);
  
  // Filter for event-based Add effects (these add flat amounts to monthly expenses)
  // Note: We only show Add effects as they're straightforward to display individually
  // Percent/Multiply effects affect everything proportionally, so harder to attribute
  // Also filter out expired effects if gameTime is provided
  const eventAddEffects = monthlyExpenseEffects.filter((effect) => {
    // Must be from event, Add type, and positive value
    if (effect.source.category !== 'event' || effect.type !== EffectType.Add || effect.value <= 0) {
      return false;
    }
    
    // Filter expired effects if gameTime is provided
    if (gameTime !== undefined && effect.durationMonths !== null && effect.durationMonths !== undefined) {
      const isExpired = gameTime >= effect.createdAt + effect.durationMonths;
      if (isExpired) {
        return false;
      }
    }
    
    return true;
  });
  
  eventAddEffects.forEach((effect) => {
    breakdown.push({
      label: effect.source.name || 'Event effect',
      amount: effect.value,
      category: 'event',
      sourceId: effect.source.id,
        sourceType: SourceType.Event, // SourceType.Event as string
      sourceName: effect.source.name || 'Event effect',
    });
  });

  // Note: One-time costs are NOT included here - they're tracked separately in monthlyOneTimeCostDetails
  // This breakdown only includes recurring monthly expenses (base, staff, upgrades, event-based changes)
  // Each item is shown individually - no combining

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
