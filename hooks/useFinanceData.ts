import { useGameStore } from '@/lib/store/gameStore';

/**
 * Custom hook for accessing finance-related data from the game store.
 * Used by components that need metrics and weekly history data.
 */
export const useFinanceData = () => {
  const { metrics, weeklyHistory } = useGameStore();
  
  return {
    metrics,
    weeklyHistory,
    // Helper: Get the most recent week's data
    lastWeek: weeklyHistory.length > 0 ? weeklyHistory[weeklyHistory.length - 1] : null,
    // Helper: Calculate total profit
    totalProfit: metrics.totalRevenue - metrics.totalExpenses,
  };
};
