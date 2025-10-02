/**
 * Economy Feature
 * Handles all economy-related config and mechanics
 */

// Configuration
export const INITIAL_MONEY = 1000;
export const INITIAL_SCORE = 0;
export const SCORE_PER_CUSTOMER = 1;

export const BASE_EXPENSES = {
  rent: 200,
  utilities: 50,
  supplies: 30,
};

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
 * Calculates weekly base expenses
 */
export function getWeeklyBaseExpenses(): number {
  return BASE_EXPENSES.rent + BASE_EXPENSES.utilities + BASE_EXPENSES.supplies;
}

/**
 * Handles end of week calculations
 */
export function endOfWeek(
  currentCash: number,
  weeklyRevenue: number,
  weeklyExpenses: number
): { cash: number; profit: number } {
  const profit = weeklyRevenue - weeklyExpenses;
  const newCash = currentCash + profit;
  
  return {
    cash: newCash,
    profit
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
  currentReputation: number
): {
  currentWeek: number;
  cash: number;
  weeklyRevenue: number;
  weeklyExpenses: number;
  reputation: number;
} {
  const { cash, profit } = endOfWeek(currentCash, weeklyRevenue, weeklyExpenses);
  
  return {
    currentWeek: currentWeek + 1,
    cash,
    weeklyRevenue: 0, // Reset weekly tracking
    weeklyExpenses: 0, // Reset weekly tracking
    reputation: currentReputation, // Reputation persists
  };
}
