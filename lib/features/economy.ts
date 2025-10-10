/**
 * Economy Feature
 * Handles all economy-related config and mechanics
 */

import { BASE_UPGRADE_METRICS, BUSINESS_METRICS, BUSINESS_STATS, getUpgradeById, UpgradeDefinition } from '@/lib/game/config';
import { calculateActiveUpgradeMetrics, getUpgradeLevel } from './upgrades';
import { Upgrades } from '@/lib/store/types';

const SCORE_PER_CUSTOMER = BUSINESS_STATS.reputationGainPerHappyCustomer;
const BASE_WEEKLY_EXPENSES = BUSINESS_METRICS.weeklyExpenses;

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
export function addServiceScore(currentScore: number, reputationMultiplier: number = 1): number {
  const reputationGain = Math.floor(SCORE_PER_CUSTOMER * reputationMultiplier);
  return currentScore + reputationGain;
}

/**
 * Processes a completed service and returns updated economy state
 */
export function processServiceCompletion(
  currentCash: number, 
  currentReputation: number, 
  servicePrice: number,
  reputationMultiplier: number = 1
): { cash: number; reputation: number } {
  return {
    cash: addServiceRevenue(currentCash, servicePrice), 
    reputation: addServiceScore(currentReputation, reputationMultiplier)
  };
}

/**
 * Returns the baseline weekly operating expenses
 */
export function getWeeklyBaseExpenses(): number {
  return BASE_WEEKLY_EXPENSES;
}

function calculateUpgradeExpenseFromDefinition(upgrade: UpgradeDefinition): number {
  return upgrade.effects
    .filter((effect) => effect.metric === 'weeklyExpenses')
    .reduce((total, effect) => {
      if (effect.type === 'add') {
        return total + effect.value;
      }

      if (effect.type === 'percent') {
        return total + BASE_WEEKLY_EXPENSES * effect.value;
      }

      return total;
    }, 0);
}

export function buildWeeklyExpenseBreakdown(
  upgrades: Upgrades,
  weeklyOneTimeCosts: number = 0,
): ExpenseBreakdownItem[] {
  const breakdown: ExpenseBreakdownItem[] = [
    {
      label: 'Base operations',
      amount: BASE_WEEKLY_EXPENSES,
      category: 'base',
    },
  ];

  Object.entries(upgrades)
    .filter(([_, level]) => level > 0)
    .forEach(([upgradeId, level]) => {
      const upgrade = getUpgradeById(upgradeId as any);
      if (!upgrade) return;
      
      const additionalExpenses = calculateUpgradeExpenseFromDefinition(upgrade) * level;
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
export function calculateUpgradeWeeklyExpenses(upgrades: Upgrades): number {
  const { currentMetrics } = calculateActiveUpgradeMetrics(upgrades);
  return Math.max(0, currentMetrics.weeklyExpenses - BASE_UPGRADE_METRICS.weeklyExpenses);
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
  const baseExpenses = getWeeklyBaseExpenses();
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
): {
  currentWeek: number;
  cash: number;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyOneTimeCosts: number;
  reputation: number;
  weeklyExpenseAdjustments: number;
} {
  const { cash } = endOfWeek(currentCash, weeklyRevenue, weeklyExpenses, weeklyOneTimeCosts, weeklyOneTimeCostsPaid);

  return {
    currentWeek: currentWeek + 1,
    cash,
    weeklyRevenue: 0, // Reset weekly tracking
    weeklyExpenses: getWeeklyBaseExpenses() + calculateUpgradeWeeklyExpenses(upgrades),
    weeklyOneTimeCosts: 0, // Reset one-time costs
    reputation: currentReputation, // Reputation persists
    weeklyExpenseAdjustments: 0,
  };
}
