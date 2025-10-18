import { StateCreator } from 'zustand';
import { Metrics } from '../types';
import { GameState } from '../types';
import { DEFAULT_INDUSTRY_ID, getBusinessMetrics } from '@/lib/game/config';

// Shared initial metrics state - single source of truth
export const getInitialMetrics = (industryId: string = DEFAULT_INDUSTRY_ID): Metrics => {
  const metrics = getBusinessMetrics(industryId);
  return {
    cash: metrics.startingCash,
    totalRevenue: 0,
    totalExpenses: 0, //TODO: Should this  from config also?
    reputation: metrics.startingReputation,
  };
};

export interface MetricsSlice {
  metrics: Metrics;
  
  updateMetrics: (updates: Partial<Metrics>) => void;
  updateWeeklyRevenue: (amount: number) => void;
  updateWeeklyExpenses: (amount: number) => void;
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
  
});
