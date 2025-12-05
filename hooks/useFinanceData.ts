import { useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { useConfigStore } from '@/lib/store/configStore';
import { DEFAULT_INDUSTRY_ID, getBusinessMetrics } from '@/lib/game/config';
import { buildMonthlyExpenseBreakdown } from '@/lib/features/economy';
import { REVENUE_CATEGORY_LABELS, RevenueCategory } from '@/lib/store/types';

/**
 * Custom hook for accessing finance-related data from the game store.
 * Used by components that need metrics and monthly history data.
 */
export const useFinanceData = () => {
  const {
    metrics,
    monthlyHistory,
    monthlyExpenses,
    monthlyOneTimeCosts,
    monthlyRevenue,
    monthlyRevenueDetails,
    upgrades,
    selectedIndustry,
    hiredStaff,
    gameTime,
  } = useGameStore();
  const configStatus = useConfigStore((state) => state.configStatus);
  const industryId = selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID;
  const businessMetrics = getBusinessMetrics(industryId);

  // Only build expense breakdown if config is ready
  const expenseBreakdown = useMemo(() => {
    if (configStatus !== 'ready' || !businessMetrics) {
      return [];
    }
    try {
      return buildMonthlyExpenseBreakdown(upgrades, industryId, hiredStaff, gameTime);
    } catch (error) {
      // If config isn't ready, return empty array
      console.warn('[useFinanceData] Config not ready, returning empty expense breakdown', error);
      return [];
    }
  }, [upgrades, industryId, hiredStaff, gameTime, configStatus, businessMetrics]);

  const revenueBreakdown = useMemo(() => {
    const totals = new Map<RevenueCategory, number>();

    monthlyRevenueDetails.forEach((entry) => {
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
    });

    return Array.from(totals.entries()).map(([category, amount]) => ({
      category,
      amount,
      label: REVENUE_CATEGORY_LABELS[category],
    }));
  }, [monthlyRevenueDetails]);

  return {
    metrics,
    monthlyHistory,
    monthlyRevenue, // Current month's accumulating revenue
    monthlyExpenses, // Current monthly expenses (base + upgrade-driven)
    monthlyExpenseBreakdown: expenseBreakdown,
    monthlyRevenueBreakdown: revenueBreakdown,
    baseMonthlyExpenses: businessMetrics?.monthlyExpenses ?? 0,
    monthlyOneTimeCosts,
    // Helper: Get the most recent month's data
    lastMonth: monthlyHistory.length > 0 ? monthlyHistory[monthlyHistory.length - 1] : null,
    // Helper: Calculate total profit
    totalProfit: metrics.totalRevenue - metrics.totalExpenses,
  };
};
