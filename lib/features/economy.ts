/**
 * Economy Feature
 * Handles all economy-related config and mechanics
 */

import {
  INITIAL_CASH,
  STARTING_REPUTATION,
  REPUTATION_GAIN_PER_HAPPY_CUSTOMER,
  WEEKLY_EXPENSES,
  BASE_UPGRADE_METRICS,
} from '@/lib/game/config';
import { ActiveUpgradeIds, calculateActiveUpgradeMetrics } from './upgrades';

// Configuration (now using centralized config)
export const INITIAL_MONEY = INITIAL_CASH;
export const INITIAL_SCORE = STARTING_REPUTATION;
export const SCORE_PER_CUSTOMER = REPUTATION_GAIN_PER_HAPPY_CUSTOMER;

export const BASE_EXPENSES = WEEKLY_EXPENSES;

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
 * Calculates weekly base expenses using loop (scalable)
 */
export function getWeeklyBaseExpenses(): number {
  return Object.values(BASE_EXPENSES).reduce((total, expense) => total + expense, 0);
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
