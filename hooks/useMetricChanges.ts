import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export interface MetricChange {
  cash?: number;
  time?: number;
  myTime?: number; // Separate tracking for myTime
  leveragedTime?: number; // Separate tracking for leveragedTime
  exp?: number; // Previously: skillLevel
  revenue?: number;
  expenses?: number;
}

export function useMetricChanges() {
  const { metrics, monthlyRevenue, monthlyExpenses } = useGameStore();
  const prevMetrics = useRef({
    cash: metrics.cash,
    time: metrics.myTime + metrics.leveragedTime,
    myTime: metrics.myTime,
    leveragedTime: metrics.leveragedTime,
    exp: metrics.exp,
    revenue: monthlyRevenue,
    expenses: monthlyExpenses,
  });
  const [changes, setChanges] = useState<MetricChange>({});

  useEffect(() => {
    const newChanges: MetricChange = {};

    // Track cash changes
    if (metrics.cash !== prevMetrics.current.cash) {
      newChanges.cash = metrics.cash - prevMetrics.current.cash;
    }

    // Track time changes (total for backward compatibility)
    const currentTime = metrics.myTime + metrics.leveragedTime;
    if (currentTime !== prevMetrics.current.time) {
      newChanges.time = currentTime - prevMetrics.current.time;
    }

    // Track myTime changes separately
    if (metrics.myTime !== prevMetrics.current.myTime) {
      newChanges.myTime = metrics.myTime - prevMetrics.current.myTime;
    }

    // Track leveragedTime changes separately
    if (metrics.leveragedTime !== prevMetrics.current.leveragedTime) {
      newChanges.leveragedTime = metrics.leveragedTime - prevMetrics.current.leveragedTime;
    }

    // Track exp changes (previously skill level)
    if (metrics.exp !== prevMetrics.current.exp) {
      newChanges.exp = metrics.exp - prevMetrics.current.exp;
    }

    // Track revenue changes
    if (monthlyRevenue !== prevMetrics.current.revenue) {
      newChanges.revenue = monthlyRevenue - prevMetrics.current.revenue;
    }

    // Track expense changes
    if (monthlyExpenses !== prevMetrics.current.expenses) {
      newChanges.expenses = monthlyExpenses - prevMetrics.current.expenses;
    }

    // Update previous values
    prevMetrics.current = {
      cash: metrics.cash,
      time: metrics.myTime + metrics.leveragedTime,
      myTime: metrics.myTime,
      leveragedTime: metrics.leveragedTime,
      exp: metrics.exp,
      revenue: monthlyRevenue,
      expenses: monthlyExpenses,
    };

    // Only set changes if there are actual changes
    if (Object.keys(newChanges).length > 0) {
      setChanges(newChanges);
      
      // Clear changes after a short delay
      const timer = setTimeout(() => {
        setChanges({});
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [metrics.cash, metrics.myTime, metrics.leveragedTime, metrics.exp, monthlyRevenue, monthlyExpenses]);

  return changes;
}

