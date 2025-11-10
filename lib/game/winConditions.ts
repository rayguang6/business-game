import type { MonthlyHistoryEntry } from '@/lib/store/types';

export interface WinCondition {
  founderHoursMax: number;
  monthlyProfitTarget: number;
  consecutiveMonthsRequired: number;
}

export interface LoseCondition {
  cashThreshold: number;           // Game over if cash <= this value
  reputationThreshold: number;    // Game over if reputation <= this value
  founderHoursMax: number;         // Game over if founder hours > this value (burnout)
}

export const DEFAULT_WIN_CONDITION: WinCondition = {
  founderHoursMax: 40,        // Part-time threshold (40 hours = 1 week/month)
  monthlyProfitTarget: 5000,  // $5k profit per month
  consecutiveMonthsRequired: 2 // Must achieve 2 months in a row
};

export const DEFAULT_LOSE_CONDITION: LoseCondition = {
  cashThreshold: 0,           // Game over if cash <= $0
  reputationThreshold: 0,      // Game over if reputation <= 0
  founderHoursMax: 400,       // Game over if founder hours > 400 (burnout threshold)
};

/**
 * Checks if the player has met the win condition
 * @param monthlyHistory - Array of completed months
 * @param currentFounderHours - Current founder working hours requirement
 * @param winCondition - Win condition configuration
 * @returns true if win condition is met
 */
export function checkWinCondition(
  monthlyHistory: MonthlyHistoryEntry[],
  currentFounderHours: number,
  winCondition: WinCondition
): boolean {
  // Check founder hours condition
  const founderHoursMet = currentFounderHours <= winCondition.founderHoursMax;
  
  // Check consecutive profitable months
  const consecutiveMonthsMet = checkConsecutiveProfitableMonths(
    monthlyHistory,
    winCondition.monthlyProfitTarget,
    winCondition.consecutiveMonthsRequired
  );
  
  // Both conditions must be met
  return founderHoursMet && consecutiveMonthsMet;
}

/**
 * Checks if there are enough consecutive months meeting the profit target
 * @param monthlyHistory - Array of completed months (most recent last)
 * @param profitTarget - Minimum profit required per month
 * @param requiredConsecutive - Number of consecutive months required
 * @returns true if condition is met
 */
function checkConsecutiveProfitableMonths(
  monthlyHistory: MonthlyHistoryEntry[],
  profitTarget: number,
  requiredConsecutive: number
): boolean {
  if (monthlyHistory.length < requiredConsecutive) {
    return false;
  }
  
  // Check the last N months (most recent months are at the end of the array)
  const recentMonths = monthlyHistory.slice(-requiredConsecutive);
  
  // All recent months must meet the profit target
  return recentMonths.every(month => month.profit >= profitTarget);
}

