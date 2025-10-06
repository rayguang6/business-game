/**
 * Economy Feature
 * Handles all economy-related config and mechanics
 */

import { BASE_UPGRADE_METRICS, BUSINESS_METRICS, getUpgradeById, UpgradeDefinition } from '@/lib/game/config';
import { ActiveUpgradeIds, calculateActiveUpgradeMetrics } from './upgrades';

const SCORE_PER_CUSTOMER = BUSINESS_METRICS.reputationGainPerHappyCustomer;
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
  upgrades: ActiveUpgradeIds,
  weeklyOneTimeCosts: number = 0,
): ExpenseBreakdownItem[] {
  const breakdown: ExpenseBreakdownItem[] = [
    {
      label: 'Base operations',
      amount: BASE_WEEKLY_EXPENSES,
      category: 'base',
    },
  ];

  upgrades
    .map((upgradeId) => getUpgradeById(upgradeId))
    .filter((upgrade): upgrade is UpgradeDefinition => Boolean(upgrade))
    .forEach((upgrade) => {
      const additionalExpenses = calculateUpgradeExpenseFromDefinition(upgrade);
      if (additionalExpenses > 0) {
        breakdown.push({
          label: upgrade.name,
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
export function calculateUpgradeWeeklyExpenses(upgrades: ActiveUpgradeIds): number {
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
  weeklyOneTimeCosts: number = 0
): { cash: number; profit: number; totalExpenses: number; baseExpenses: number; additionalExpenses: number; oneTimeCosts: number } {
  // weeklyExpenses already contains base expenses, so don't add them again
  // Total expenses = weeklyExpenses (which includes base) + one-time costs
  const totalExpenses = weeklyExpenses + weeklyOneTimeCosts;
  
  // Only deduct expenses (cash was already updated during the week)
  const newCash = currentCash - totalExpenses;
  
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
  currentReputation: number,
  upgrades: ActiveUpgradeIds,
): {
  currentWeek: number;
  cash: number;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyOneTimeCosts: number;
  reputation: number;
  weeklyExpenseAdjustments: number;
} {
  const { cash } = endOfWeek(currentCash, weeklyRevenue, weeklyExpenses, weeklyOneTimeCosts);

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
