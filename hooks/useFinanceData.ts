import { useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { BUSINESS_METRICS } from '@/lib/game/config';
import { buildWeeklyExpenseBreakdown } from '@/lib/features/economy';

/**
 * Custom hook for accessing finance-related data from the game store.
 * Used by components that need metrics and weekly history data.
 */
export const useFinanceData = () => {
  const { metrics, weeklyHistory, weeklyExpenses, weeklyOneTimeCosts, upgrades } = useGameStore();

  const expenseBreakdown = useMemo(
    () => buildWeeklyExpenseBreakdown(upgrades, weeklyOneTimeCosts),
    [upgrades, weeklyOneTimeCosts],
  );

  return {
    metrics,
    weeklyHistory,
    weeklyExpenses, // Current weekly expenses (base + upgrade-driven)
    weeklyExpenseBreakdown: expenseBreakdown,
    baseWeeklyExpenses: BUSINESS_METRICS.weeklyExpenses,
    weeklyOneTimeCosts,
    // Helper: Get the most recent week's data
    lastWeek: weeklyHistory.length > 0 ? weeklyHistory[weeklyHistory.length - 1] : null,
    // Helper: Calculate total profit
    totalProfit: metrics.totalRevenue - metrics.totalExpenses,
  };
};
