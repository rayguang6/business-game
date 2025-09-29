import { BASE_EXPENSES, SCORE_PER_CUSTOMER } from './config';


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
 * Handles week transition logic - resets weekly tracking
 */
export function handleWeekTransition(): {
  weeklyRevenue: number;
  weeklyExpenses: number;
} {
  return {
    weeklyRevenue: 0,
    weeklyExpenses: 0
  };
}

/**
 * Returns the fixed weekly expenses from config
 */
export function getWeeklyBaseExpenses(): number {
  return Object.values(BASE_EXPENSES).reduce((sum, amount) => sum + amount, 0);
}

/**
 * Handles end-of-week business operations
 */
export function endOfWeek(
  currentCash: number,
  currentRevenue: number,
  currentExpenses: number,
  currentReputation: number,
  weekNumber: number
): {
  cash: number;
  weeklyRevenue: number;
  weeklyExpenses: number;
  reputation: number;
  weeklyReputationChange: number;
  weeklySummary: {
    revenueEarned: number;
    expensesPaid: number;
    netProfit: number;
    reputationGained: number;
  };
} {
  // Calculate weekly expenses (basic business costs)
  const totalWeeklyExpenses = Object.values(BASE_EXPENSES).reduce((a,b)=>a+b,0);

  // Apply expenses to cash
  const newCash = currentCash - totalWeeklyExpenses;
  
  // Calculate weekly reputation change (for now, no change - can be extended later)
  const weeklyReputationChange = 0; // Could be based on customer satisfaction, events, etc.
  
  // Calculate weekly summary
  const weeklySummary = {
    revenueEarned: currentRevenue,
    expensesPaid: totalWeeklyExpenses,
    netProfit: currentRevenue - totalWeeklyExpenses,
    reputationGained: weeklyReputationChange
  };
  
  return {
    cash: Math.max(0, newCash), // Don't go below 0
    weeklyRevenue: currentRevenue, // This week's revenue
    weeklyExpenses: totalWeeklyExpenses, // This week's expenses
    reputation: currentReputation, // Keep reputation
    weeklyReputationChange,
    weeklySummary
  };
}
