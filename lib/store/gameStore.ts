import { create } from 'zustand';
import { createIndustrySlice, IndustrySlice } from './slices/industrySlice';
import { createGameSlice, GameSlice } from './slices/gameSlice';
import { createMetricsSlice, MetricsSlice } from './slices/metricsSlice';
import { createMonthlySlice, MonthlySlice } from './slices/monthlySlice';
import { createCustomerSlice, CustomerSlice } from './slices/customerSlice';
import { createUpgradesSlice, UpgradesSlice } from './slices/upgradesSlice';
import { EventSlice, createEventSlice } from './slices/eventSlice';
import { createStaffSlice, StaffSlice } from './slices/staffSlice';
import { createMarketingSlice, MarketingSlice } from './slices/marketingSlice';
import { createConditionSlice, ConditionSlice } from './slices/conditionSlice';

// Combine all slices into the main store
export type GameStore = IndustrySlice & GameSlice & MetricsSlice & MonthlySlice & CustomerSlice & UpgradesSlice & EventSlice & StaffSlice & MarketingSlice & ConditionSlice;

export const useGameStore = create<GameStore>()((...args) => ({
  ...createIndustrySlice(...args),
  ...createGameSlice(...args),
  ...createMetricsSlice(...args),
  ...createMonthlySlice(...args),
  ...createCustomerSlice(...args),
  ...createUpgradesSlice(...args),
  ...createEventSlice(...args),
  ...createStaffSlice(...args),
  ...createMarketingSlice(...args),
  ...createConditionSlice(...args),
}));
