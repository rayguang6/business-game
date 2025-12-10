import type { MonthlyHistoryEntry } from '@/lib/store/types';

export interface WinCondition {
  cashTarget?: number;             // Target cash amount to win (optional)
  monthTarget?: number;            // Target months to survive (optional)
  customTitle?: string;            // Custom victory title (optional)
  customMessage?: string;          // Custom victory message (optional)
}

export interface LoseCondition {
  cashThreshold?: number;           // Game over if cash <= this value (optional)
  timeThreshold?: number;            // Game over if time <= this value (0 = no time left, optional)
}


/**
 * Checks if the player has met the win condition
 * @param currentCash - Current cash amount
 * @param currentMonth - Current month number
 * @param winCondition - Win condition configuration
 * @returns true if win condition is met
 */
export function checkWinCondition(
  currentCash: number,
  currentMonth: number,
  winCondition: WinCondition
): boolean {
  // Win condition: reach target cash amount OR survive target months
  // Only check conditions that are actually configured
  const cashWin = winCondition.cashTarget !== undefined ? currentCash >= winCondition.cashTarget : false;
  const monthWin = winCondition.monthTarget !== undefined ? currentMonth >= winCondition.monthTarget : false;

  // If no win conditions are configured, never win
  if (winCondition.cashTarget === undefined && winCondition.monthTarget === undefined) {
    return false;
  }

  return cashWin || monthWin;
}


