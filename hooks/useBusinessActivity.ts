import { useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

/**
 * Custom hook for accessing business activity data (customers, leads, time)
 * Similar to useFinanceData but for operational metrics
 */
export const useBusinessActivity = () => {
  const {
    metrics,
    monthlyHistory,
    monthlyCustomersServed,
    monthlyCustomersLost,
    monthlyHappyCustomers,
    monthlyAngryFromService,
    monthlyAngryFromImpatience,
    monthlyLeadsGenerated,
    monthlyTimeSpent,
    currentMonth,
  } = useGameStore();

  // Current month stats (from monthly tracking)
  const currentMonthStats = useMemo(() => ({
    customersServed: monthlyCustomersServed,
    customersLost: monthlyCustomersLost,
    happyCustomers: monthlyHappyCustomers,
    angryFromService: monthlyAngryFromService,
    angryFromImpatience: monthlyAngryFromImpatience,
    totalCustomers: monthlyCustomersServed + monthlyCustomersLost,
    leadsGenerated: monthlyLeadsGenerated,
    timeSpent: monthlyTimeSpent,
  }), [
    monthlyCustomersServed, 
    monthlyCustomersLost, 
    monthlyHappyCustomers,
    monthlyAngryFromService,
    monthlyAngryFromImpatience,
    monthlyLeadsGenerated, 
    monthlyTimeSpent
  ]);

  // Lifetime totals (from metrics)
  const lifetimeTotals = useMemo(() => ({
    totalCustomersServed: metrics.totalCustomersServed,
    totalLeadsGenerated: metrics.totalLeadsGenerated,
    totalTimeSpent: metrics.totalTimeSpent,
  }), [metrics.totalCustomersServed, metrics.totalLeadsGenerated, metrics.totalTimeSpent]);

  // Calculate totals from history for verification
  const historyTotals = useMemo(() => {
    return monthlyHistory.reduce((acc, entry) => ({
      customersServed: acc.customersServed + entry.customersServed,
      customersLost: acc.customersLost + entry.customersLost,
      happyCustomers: acc.happyCustomers + (entry.happyCustomers || 0),
      angryFromService: acc.angryFromService + (entry.angryFromService || 0),
      angryFromImpatience: acc.angryFromImpatience + (entry.angryFromImpatience || 0),
      totalCustomers: acc.totalCustomers + (entry.totalCustomers || entry.customersServed + entry.customersLost),
      leadsGenerated: acc.leadsGenerated + entry.leadsGenerated,
      timeSpent: acc.timeSpent + entry.timeSpent,
    }), {
      customersServed: 0,
      customersLost: 0,
      happyCustomers: 0,
      angryFromService: 0,
      angryFromImpatience: 0,
      totalCustomers: 0,
      leadsGenerated: 0,
      timeSpent: 0,
    });
  }, [monthlyHistory]);

  // Calculated business metrics (simplified for display)
  const businessMetrics = useMemo(() => {
    const totalCustomers = currentMonthStats.totalCustomers;
    const customersServed = currentMonthStats.customersServed;
    const happyCustomers = currentMonthStats.happyCustomers;

    return {
      // Key metrics for display
      totalCustomers: totalCustomers,
      customersServed: customersServed,
      happyCustomers: happyCustomers,
      
      // Calculated rates
      serviceRate: totalCustomers > 0 ? (customersServed / totalCustomers) * 100 : 0,
      satisfactionRate: customersServed > 0 ? (happyCustomers / customersServed) * 100 : 0,
      lossRate: totalCustomers > 0 ? (currentMonthStats.customersLost / totalCustomers) * 100 : 0,
    };
  }, [currentMonthStats]);

  return {
    // Current month (in progress)
    currentMonth,
    currentMonthStats,

    // Lifetime totals
    lifetimeTotals,

    // Monthly history
    monthlyHistory,

    // Calculated business metrics
    businessMetrics,

    // Calculated from history (for verification)
    historyTotals,

    // Current time remaining
    timeRemaining: metrics.myTime + metrics.leveragedTime,
  };
};

