import { create } from 'zustand';
import { createIndustrySlice, IndustrySlice } from './slices/industrySlice';
import { createGameSlice, GameSlice } from './slices/gameSlice';
import { createMetricsSlice, MetricsSlice } from './slices/metricsSlice';
import { createWeeklySlice, WeeklySlice } from './slices/weeklySlice';
import { createCustomerSlice, CustomerSlice } from './slices/customerSlice';

// Combine all slices into the main store
export type GameStore = IndustrySlice & GameSlice & MetricsSlice & WeeklySlice & CustomerSlice;

export const useGameStore = create<GameStore>()((...args) => ({
  ...createIndustrySlice(...args),
  ...createGameSlice(...args),
  ...createMetricsSlice(...args),
  ...createWeeklySlice(...args),
  ...createCustomerSlice(...args),
}));