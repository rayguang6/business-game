import { StateCreator } from 'zustand';
import { Metrics } from '../types';
import { GameState } from '../types';
import { ECONOMY_CONFIG } from '@/lib/config/gameConfig';

// Shared initial metrics state - single source of truth
export const getInitialMetrics = (): Metrics => ({
  cash: ECONOMY_CONFIG.INITIAL_MONEY,
  totalRevenue: 0,
  totalExpenses: 0,
  reputation: ECONOMY_CONFIG.INITIAL_REPUTATION,
});

export interface MetricsSlice {
  metrics: Metrics;
  
  updateMetrics: (updates: Partial<Metrics>) => void;
  updateWeeklyRevenue: (amount: number) => void;
  updateWeeklyExpenses: (amount: number) => void;
  addOneTimeCost: (amount: number) => void;
}

export const createMetricsSlice: StateCreator<GameState, [], [], MetricsSlice> = (set) => ({
  metrics: getInitialMetrics(),
  
  updateMetrics: (updates: Partial<Metrics>) => {
    set((state) => ({
      metrics: { ...state.metrics, ...updates }
    }));
  },
  
  updateWeeklyRevenue: (amount: number) => {
    set((state) => ({
      weeklyRevenue: state.weeklyRevenue + amount,
      metrics: {
        ...state.metrics,
        cash: state.metrics.cash + amount,
        totalRevenue: state.metrics.totalRevenue + amount
      }
    }));
  },
  
  updateWeeklyExpenses: (amount: number) => {
    set((state) => ({
      weeklyExpenses: state.weeklyExpenses + amount,
      // Note: Additional expenses are only deducted at end of week, not immediately
    }));
  },
  
  addOneTimeCost: (amount: number) => {
    set((state) => ({
      weeklyOneTimeCosts: state.weeklyOneTimeCosts + amount,
      // Note: One-time costs are only deducted at end of week, not immediately
    }));
  },
});
