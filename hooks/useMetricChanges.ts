import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export interface MetricChange {
  cash?: number;
  time?: number;
  exp?: number; // Previously: skillLevel
  revenue?: number;
  expenses?: number;
  freedomScore?: number; // Previously: founderWorkingHours
}

export function useMetricChanges() {
  const { metrics, monthlyRevenue, monthlyExpenses } = useGameStore();
  const prevMetrics = useRef({
    cash: metrics.cash,
    time: metrics.time,
    exp: metrics.exp,
    revenue: monthlyRevenue,
    expenses: monthlyExpenses,
    freedomScore: metrics.freedomScore,
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

    // Track freedom score changes (previously founderWorkingHours)
    if (metrics.freedomScore !== prevMetrics.current.freedomScore) {
      newChanges.freedomScore = metrics.freedomScore - prevMetrics.current.freedomScore;
    }

    // Update previous values
    prevMetrics.current = {
      cash: metrics.cash,
      time: metrics.time,
      exp: metrics.exp,
      revenue: monthlyRevenue,
      expenses: monthlyExpenses,
      freedomScore: metrics.freedomScore,
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
  }, [metrics.cash, metrics.time, metrics.exp, metrics.freedomScore, monthlyRevenue, monthlyExpenses]);

  return changes;
}

