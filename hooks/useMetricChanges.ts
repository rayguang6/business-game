import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export interface MetricChange {
  cash?: number;
  time?: number;
  reputation?: number;
  revenue?: number;
  expenses?: number;
  founderWorkingHours?: number;
}

export function useMetricChanges() {
  const { metrics, monthlyRevenue, monthlyExpenses } = useGameStore();
  const prevMetrics = useRef({
    cash: metrics.cash,
    time: metrics.time,
    reputation: metrics.reputation,
    revenue: monthlyRevenue,
    expenses: monthlyExpenses,
    founderWorkingHours: metrics.founderWorkingHours,
  });
  const [changes, setChanges] = useState<MetricChange>({});

  useEffect(() => {
    const newChanges: MetricChange = {};

    // Track cash changes
    if (metrics.cash !== prevMetrics.current.cash) {
      newChanges.cash = metrics.cash - prevMetrics.current.cash;
    }

    // Track time changes
    if (metrics.time !== prevMetrics.current.time) {
      newChanges.time = metrics.time - prevMetrics.current.time;
    }

    // Track reputation changes
    if (metrics.reputation !== prevMetrics.current.reputation) {
      newChanges.reputation = metrics.reputation - prevMetrics.current.reputation;
    }

    // Track revenue changes
    if (monthlyRevenue !== prevMetrics.current.revenue) {
      newChanges.revenue = monthlyRevenue - prevMetrics.current.revenue;
    }

    // Track expense changes
    if (monthlyExpenses !== prevMetrics.current.expenses) {
      newChanges.expenses = monthlyExpenses - prevMetrics.current.expenses;
    }

    // Track founder hours required changes
    if (metrics.founderWorkingHours !== prevMetrics.current.founderWorkingHours) {
      newChanges.founderWorkingHours = metrics.founderWorkingHours - prevMetrics.current.founderWorkingHours;
    }

    // Update previous values
    prevMetrics.current = {
      cash: metrics.cash,
      time: metrics.time,
      reputation: metrics.reputation,
      revenue: monthlyRevenue,
      expenses: monthlyExpenses,
      founderWorkingHours: metrics.founderWorkingHours,
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
  }, [metrics.cash, metrics.time, metrics.reputation, metrics.founderWorkingHours, monthlyRevenue, monthlyExpenses]);

  return changes;
}

