/**
 * Economy Feature
 * Handles all economy-related config and mechanics
 */

import { ECONOMY_CONFIG } from '@/lib/config/gameConfig';

// Configuration (now using centralized config)
export const INITIAL_MONEY = ECONOMY_CONFIG.INITIAL_MONEY;
export const INITIAL_SCORE = ECONOMY_CONFIG.INITIAL_REPUTATION;
export const SCORE_PER_CUSTOMER = ECONOMY_CONFIG.REPUTATION_GAIN_PER_HAPPY_CUSTOMER;

export const BASE_EXPENSES = ECONOMY_CONFIG.WEEKLY_BASE_EXPENSES;

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
export function addServiceScore(currentScore: number): number {
  return currentScore + SCORE_PER_CUSTOMER;
}

/**
 * Processes a completed service and returns updated economy state
 */
export function processServiceCompletion(
  currentCash: number, 
  currentReputation: number, 
  servicePrice: number
): { cash: number; reputation: number } {
  return {
    cash: addServiceRevenue(currentCash, servicePrice), 
    reputation: addServiceScore(currentReputation)
  };
}

/**
 * Calculates weekly base expenses using loop (scalable)
 */
export function getWeeklyBaseExpenses(): number {
  return Object.values(BASE_EXPENSES).reduce((total, expense) => total + expense, 0);
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
  const additionalExpenses = weeklyExpenses - baseExpenses;
  
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
  currentReputation: number
): {
  currentWeek: number;
  cash: number;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyOneTimeCosts: number;
  reputation: number;
} {
  const { cash, profit } = endOfWeek(currentCash, weeklyRevenue, weeklyExpenses, weeklyOneTimeCosts);
  
  return {
    currentWeek: currentWeek + 1,
    cash,
    weeklyRevenue: 0, // Reset weekly tracking
    weeklyExpenses: getWeeklyBaseExpenses(), // Reset to base expenses for new week
    weeklyOneTimeCosts: 0, // Reset one-time costs
    reputation: currentReputation, // Reputation persists
  };
}
