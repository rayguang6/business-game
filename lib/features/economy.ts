/**
 * Economy Feature
 * Handles all economy-related config and mechanics
 */

import {
  DEFAULT_INDUSTRY_ID,
  getBusinessMetrics,
  getBusinessStats,
  getBaseUpgradeMetricsForIndustry,
  getUpgradeById,
  UpgradeDefinition,
} from '@/lib/game/config';
import { IndustryId, UpgradeId } from '@/lib/game/types';
import { calculateActiveUpgradeMetrics, getUpgradeLevel } from './upgrades';
import { Upgrades } from '@/lib/store/types';

export interface ExpenseBreakdownItem {
  label: string;
  amount: number;
  category: 'base' | 'upgrade' | 'event';
  sourceId?: string;
}

// Mechanics
/**
 * Adds revenue from a completed service
 */
export function addServiceRevenue(currentMoney: number, servicePrice: number): number {
  return currentMoney + servicePrice;
}

/**
 * Adds score from a completed service
 */
export function addServiceScore(
  currentScore: number,
  reputationMultiplier: number = 1,
  industryId: IndustryId,
): number {
  const scorePerCustomer = getBusinessStats(industryId).reputationGainPerHappyCustomer;
  const reputationGain = Math.floor(scorePerCustomer * reputationMultiplier);
  return currentScore + reputationGain;
}

/**
 * Processes a completed service and returns updated economy state
 */
export function processServiceCompletion(
  currentCash: number, 
  currentReputation: number, 
  servicePrice: number,
  reputationMultiplier: number = 1,
  industryId: IndustryId,
): { cash: number; reputation: number } {
  return {
    cash: addServiceRevenue(currentCash, servicePrice), 
    reputation: addServiceScore(currentReputation, reputationMultiplier, industryId)
  };
}

/**
 * Returns the baseline weekly operating expenses
 */
export function getWeeklyBaseExpenses(industryId: IndustryId): number {
  return getBusinessMetrics(industryId).weeklyExpenses;
}

function calculateUpgradeExpenseFromDefinition(
  upgrade: UpgradeDefinition,
  industryId: IndustryId,
): number {
  const baseWeeklyExpenses = getWeeklyBaseExpenses(industryId);
  return upgrade.effects
    .filter((effect) => effect.metric === 'weeklyExpenses')
    .reduce((total, effect) => {
      if (effect.type === 'add') {
        return total + effect.value;
      }

      if (effect.type === 'percent') {
        return total + baseWeeklyExpenses * effect.value;
      }

      return total;
    }, 0);
}

export function buildWeeklyExpenseBreakdown(
  upgrades: Upgrades,
  weeklyOneTimeCosts: number = 0,
  industryId: IndustryId,
): ExpenseBreakdownItem[] {
  const breakdown: ExpenseBreakdownItem[] = [
    {
      label: 'Base operations',
      amount: getWeeklyBaseExpenses(industryId),
      category: 'base',
    },
  ];

  Object.entries(upgrades)
    .filter(([_, level]) => level > 0)
    .forEach(([upgradeId, level]) => {
      const upgrade = getUpgradeById(upgradeId as UpgradeId, industryId);
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

  if (weeklyOneTimeCosts > 0) {
    breakdown.push({
      label: 'One-time costs',
      amount: weeklyOneTimeCosts,
      category: 'event',
    });
  }

  return breakdown;
}

/**
 * Calculates the total weekly expenses contributed by upgrades.
 */
export function calculateUpgradeWeeklyExpenses(
  upgrades: Upgrades,
  industryId: IndustryId,
): number {
  const { currentMetrics } = calculateActiveUpgradeMetrics(upgrades, industryId);
  const baseMetrics = getBaseUpgradeMetricsForIndustry(industryId);
  return Math.max(0, currentMetrics.weeklyExpenses - baseMetrics.weeklyExpenses);
}

/**
 * Handles end of week calculations
 * Note: Cash is updated instantly during the week, so we only deduct expenses here
 */
export function endOfWeek(
  currentCash: number,
  weeklyRevenue: number,
  weeklyExpenses: number = 0,
  weeklyOneTimeCosts: number = 0,
  weeklyOneTimeCostsPaid: number = 0,
  industryId: IndustryId,
): { cash: number; profit: number; totalExpenses: number; baseExpenses: number; additionalExpenses: number; oneTimeCosts: number } {
  // weeklyExpenses already contains base expenses, so don't add them again
  // Total expenses = weeklyExpenses (which includes base) + one-time costs
  const totalExpenses = weeklyExpenses + weeklyOneTimeCosts;
  const payableOneTimeCosts = Math.max(0, weeklyOneTimeCosts - weeklyOneTimeCostsPaid);
  
  // Only deduct expenses (cash was already updated during the week)
  const newCash = currentCash - (weeklyExpenses + payableOneTimeCosts);
  
  // Calculate profit for reporting (revenue - expenses)
  const profit = weeklyRevenue - totalExpenses;
  
  // For reporting, separate base from additional expenses
  const baseExpenses = getWeeklyBaseExpenses(industryId);
  const additionalExpenses = Math.max(weeklyExpenses - baseExpenses, 0);
  
  return {
    cash: newCash,
    profit,
    totalExpenses,
    baseExpenses,
    additionalExpenses,
    oneTimeCosts: weeklyOneTimeCosts
  };
}

/**
 * Handles week transition logic
 */
export function handleWeekTransition(
  currentWeek: number,
  currentCash: number,
  weeklyRevenue: number,
  weeklyExpenses: number,
  weeklyOneTimeCosts: number,
  weeklyOneTimeCostsPaid: number,
  currentReputation: number,
  upgrades: Upgrades,
  industryId: IndustryId,
): {
  currentWeek: number;
  cash: number;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyOneTimeCosts: number;
  reputation: number;
  weeklyExpenseAdjustments: number;
} {
  const { cash } = endOfWeek(
    currentCash,
    weeklyRevenue,
    weeklyExpenses,
    weeklyOneTimeCosts,
    weeklyOneTimeCostsPaid,
    industryId,
  );

  return {
    currentWeek: currentWeek + 1,
    cash,
    weeklyRevenue: 0, // Reset weekly tracking
    weeklyExpenses:
      getWeeklyBaseExpenses(industryId) +
      calculateUpgradeWeeklyExpenses(upgrades, industryId),
    weeklyOneTimeCosts: 0, // Reset one-time costs
    reputation: currentReputation, // Reputation persists
    weeklyExpenseAdjustments: 0,
  };
}
