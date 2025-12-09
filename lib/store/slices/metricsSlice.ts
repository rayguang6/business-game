import { StateCreator } from 'zustand';
import { Metrics } from '../types';
import { GameState } from '../types';
import { DEFAULT_INDUSTRY_ID, getBusinessMetrics } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';

// Safe default metrics for store initialization (before config loads)
const SAFE_DEFAULT_METRICS: Metrics = {
  cash: 0,
  myTime: 0,
  myTimeCapacity: 0,
  leveragedTime: 0,
  leveragedTimeCapacity: 0,
  totalRevenue: 0,
  totalExpenses: 0,
  exp: 0,
  totalLeadsSpawned: 0,
  totalCustomersGenerated: 0,
  totalTimeSpent: 0,
};

// Shared initial metrics state - single source of truth
// Returns safe defaults if config not loaded yet (will be updated when config loads)
export const getInitialMetrics = (industryId: IndustryId = DEFAULT_INDUSTRY_ID): Metrics => {
  const metrics = getBusinessMetrics(industryId);
  if (!metrics) {
    // Config not loaded yet - return safe defaults
    // Store will be updated when config loads in simulationConfigService
    return { ...SAFE_DEFAULT_METRICS };
  }
  const startingTime = metrics.startingTime ?? 0;
  return {
    cash: metrics.startingCash,
    myTime: startingTime, // Personal time, defaults to 0
    myTimeCapacity: startingTime, // Capacity never changes, equals startingTime
    leveragedTime: 0, // Leveraged time starts at 0 (will be added by upgrades/staff)
    leveragedTimeCapacity: 0, // Leveraged time capacity starts at 0
    totalRevenue: 0,
    totalExpenses: 0,
    exp: metrics.startingExp ?? 100, // Previously: startingSkillLevel - defaults to 100 (fallback)
    totalLeadsSpawned: 0,
    totalCustomersGenerated: 0,
    totalTimeSpent: 0,
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
