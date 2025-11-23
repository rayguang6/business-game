import type { MonthlyHistoryEntry } from '@/lib/store/types';

export interface WinCondition {
  cashTarget: number;              // Target cash amount to win
  monthTarget?: number;            // Target months to survive (optional)
  customTitle?: string;            // Custom victory title (optional)
  customMessage?: string;          // Custom victory message (optional)
}

export interface LoseCondition {
  cashThreshold: number;           // Game over if cash <= this value
  timeThreshold: number;            // Game over if time <= this value (0 = no time left)
}

export const DEFAULT_WIN_CONDITION: WinCondition = {
  cashTarget: 50000,  // Win when reaching $50k cash
};

export const DEFAULT_LOSE_CONDITION: LoseCondition = {
  cashThreshold: 0,  // Game over if cash <= $0
  timeThreshold: 0,  // Game over if time <= 0 (only applies if time system is enabled)
};

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
  const cashWin = currentCash >= winCondition.cashTarget;
  const monthWin = winCondition.monthTarget ? currentMonth >= winCondition.monthTarget : false;

  return cashWin || monthWin;
}


