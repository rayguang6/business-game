import { StateCreator } from 'zustand';
import { Metrics } from '../types';
import { GameState } from '../types';
import { DEFAULT_INDUSTRY_ID, getBusinessMetrics } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';

// Shared initial metrics state - single source of truth
export const getInitialMetrics = (industryId: IndustryId = DEFAULT_INDUSTRY_ID): Metrics => {
  const metrics = getBusinessMetrics(industryId);
  return {
    cash: metrics.startingCash,
    time: metrics.startingTime ?? 0, // Monthly time budget, defaults to 0
    totalRevenue: 0,
    totalExpenses: 0,
    exp: metrics.startingExp ?? 0, // Previously: startingSkillLevel - defaults to 0
    freedomScore: metrics.startingFreedomScore ?? 0, // Previously: founderWorkHours - defaults to 0
  };
};

export interface MetricsSlice {
  metrics: Metrics;
  
  updateMetrics: (updates: Partial<Metrics>) => void;
  updateMonthlyRevenue: (amount: number) => void;
  updateMonthlyExpenses: (amount: number) => void;
}

export const createMetricsSlice: StateCreator<GameState, [], [], MetricsSlice> = (set) => ({
  metrics: getInitialMetrics(),
  
  updateMetrics: (updates: Partial<Metrics>) => {
    set((state) => ({
      metrics: { ...state.metrics, ...updates }
    }));
  },
  
  updateMonthlyRevenue: (amount: number) => {
    set((state) => ({
      monthlyRevenue: state.monthlyRevenue + amount,
      metrics: {
        ...state.metrics,
        cash: state.metrics.cash + amount,
        totalRevenue: state.metrics.totalRevenue + amount
      }
    }));
  },
  
  updateMonthlyExpenses: (amount: number) => {
    set((state) => ({
      monthlyExpenses: state.monthlyExpenses + amount,
      // Note: Additional expenses are only deducted at end of month, not immediately
    }));
  },
  
});
