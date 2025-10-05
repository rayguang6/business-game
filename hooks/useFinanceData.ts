import { useGameStore } from '@/lib/store/gameStore';
import { calculateUpgradeWeeklyExpenses, getWeeklyBaseExpenses } from '@/lib/features/economy';

/**
 * Custom hook for accessing finance-related data from the game store.
 * Used by components that need metrics and weekly history data.
 */
export const useFinanceData = () => {
  const { metrics, weeklyHistory, weeklyExpenses, upgrades, selectedIndustry } = useGameStore();
  const industryId = selectedIndustry?.id ?? 'dental';
  const baseWeeklyExpenses = getWeeklyBaseExpenses();
  const upgradeWeeklyExpenses = Math.max(
    calculateUpgradeWeeklyExpenses(upgrades, industryId),
    0
  );
  const otherWeeklyExpenses = Math.max(
    weeklyExpenses - (baseWeeklyExpenses + upgradeWeeklyExpenses),
    0
  );

  return {
    metrics,
    weeklyHistory,
    weeklyExpenses, // Current weekly expenses (base + upgrade-driven)
    baseWeeklyExpenses,
    upgradeWeeklyExpenses,
    otherWeeklyExpenses,
    // Helper: Get the most recent week's data
    lastWeek: weeklyHistory.length > 0 ? weeklyHistory[weeklyHistory.length - 1] : null,
    // Helper: Calculate total profit
    totalProfit: metrics.totalRevenue - metrics.totalExpenses,
  };
};
