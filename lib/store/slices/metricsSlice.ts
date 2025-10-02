import { StateCreator } from 'zustand';
import { Metrics } from '../types';
import { GameState } from '../types';

export interface MetricsSlice {
  metrics: Metrics;
  
  updateMetrics: (updates: Partial<Metrics>) => void;
  updateWeeklyRevenue: (amount: number) => void;
  updateWeeklyExpenses: (amount: number) => void;
}

export const createMetricsSlice: StateCreator<GameState, [], [], MetricsSlice> = (set) => ({
  metrics: {
    cash: 1000,
    totalRevenue: 0,
    totalExpenses: 0,
    reputation: 0,
  },
  
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
      metrics: {
        ...state.metrics,
        cash: state.metrics.cash - amount,
        totalExpenses: state.metrics.totalExpenses + amount
      }
    }));
  },
});
