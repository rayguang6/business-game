import { useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { DEFAULT_INDUSTRY_ID, getBusinessMetrics } from '@/lib/game/config';
import { buildWeeklyExpenseBreakdown } from '@/lib/features/economy';
import { REVENUE_CATEGORY_LABELS, RevenueCategory } from '@/lib/store/types';

/**
 * Custom hook for accessing finance-related data from the game store.
 * Used by components that need metrics and weekly history data.
 */
export const useFinanceData = () => {
  const {
    metrics,
    weeklyHistory,
    weeklyExpenses,
    weeklyOneTimeCosts,
    weeklyRevenue,
    weeklyRevenueDetails,
    upgrades,
    selectedIndustry,
    hiredStaff,
  } = useGameStore();
  const industryId = selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID;
  const businessMetrics = getBusinessMetrics(industryId);

  const expenseBreakdown = useMemo(
    () => buildWeeklyExpenseBreakdown(upgrades, weeklyOneTimeCosts, industryId, hiredStaff),
    [upgrades, weeklyOneTimeCosts, industryId, hiredStaff],
  );

  const revenueBreakdown = useMemo(() => {
    const totals = new Map<RevenueCategory, number>();

    weeklyRevenueDetails.forEach((entry) => {
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
    });

    return Array.from(totals.entries()).map(([category, amount]) => ({
      category,
      amount,
      label: REVENUE_CATEGORY_LABELS[category],
    }));
  }, [weeklyRevenueDetails]);

  return {
    metrics,
    weeklyHistory,
    weeklyRevenue, // Current week's accumulating revenue
    weeklyExpenses, // Current weekly expenses (base + upgrade-driven)
    weeklyExpenseBreakdown: expenseBreakdown,
    weeklyRevenueBreakdown: revenueBreakdown,
    baseWeeklyExpenses: businessMetrics.weeklyExpenses,
    weeklyOneTimeCosts,
    // Helper: Get the most recent week's data
    lastWeek: weeklyHistory.length > 0 ? weeklyHistory[weeklyHistory.length - 1] : null,
    // Helper: Calculate total profit
    totalProfit: metrics.totalRevenue - metrics.totalExpenses,
  };
};
