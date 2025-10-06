import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export interface MetricChange {
  cash?: number;
  reputation?: number;
  revenue?: number;
  expenses?: number;
}

export function useMetricChanges() {
  const { metrics, weeklyRevenue, weeklyExpenses } = useGameStore();
  const prevMetrics = useRef({ 
    cash: metrics.cash, 
    reputation: metrics.reputation,
    revenue: weeklyRevenue,
    expenses: weeklyExpenses,
  });
  const [changes, setChanges] = useState<MetricChange>({});

  useEffect(() => {
    const newChanges: MetricChange = {};

    // Track cash changes
    if (metrics.cash !== prevMetrics.current.cash) {
      newChanges.cash = metrics.cash - prevMetrics.current.cash;
    }

    // Track reputation changes
    if (metrics.reputation !== prevMetrics.current.reputation) {
      newChanges.reputation = metrics.reputation - prevMetrics.current.reputation;
    }

    // Track revenue changes
    if (weeklyRevenue !== prevMetrics.current.revenue) {
      newChanges.revenue = weeklyRevenue - prevMetrics.current.revenue;
    }

    // Track expense changes
    if (weeklyExpenses !== prevMetrics.current.expenses) {
      newChanges.expenses = weeklyExpenses - prevMetrics.current.expenses;
    }

    // Update previous values
    prevMetrics.current = {
      cash: metrics.cash,
      reputation: metrics.reputation,
      revenue: weeklyRevenue,
      expenses: weeklyExpenses,
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
  }, [metrics.cash, metrics.reputation, weeklyRevenue, weeklyExpenses]);

  return changes;
}

